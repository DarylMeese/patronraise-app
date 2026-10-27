<?php
/**
 * PatronRaise API Proxy — registers WP REST routes that proxy to the Attention Network API.
 *
 * Auth routes handle login/logout/register.
 * The catch-all proxy route forwards any path to the canonical API with JWT auth.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class PatronRaise_App_API_Proxy {

	const NAMESPACE = 'patronraise-app/v1';

	/**
	 * Initialize REST route registration.
	 */
	public static function init() {
		add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
	}

	/**
	 * Verify WordPress REST nonce to prevent CSRF.
	 *
	 * @param WP_REST_Request $request
	 * @return bool|WP_Error
	 */
	public static function verify_nonce( WP_REST_Request $request ) {
		$nonce = $request->get_header( 'X-WP-Nonce' );
		if ( empty( $nonce ) || ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
			return new WP_Error(
				'rest_cookie_invalid_nonce',
				__( 'Cookie check failed.', 'patronraise-app' ),
				array( 'status' => 403 )
			);
		}
		return true;
	}

	/**
	 * Verify WordPress REST nonce and active PatronRaise session.
	 *
	 * @param WP_REST_Request $request
	 * @return bool|WP_Error
	 */
	public static function verify_authenticated_nonce( WP_REST_Request $request ) {
		$nonce_check = self::verify_nonce( $request );
		if ( is_wp_error( $nonce_check ) ) {
			return $nonce_check;
		}
		if ( ! PatronRaise_App_Auth_Bridge::is_authenticated() ) {
			return new WP_Error(
				'not_authenticated',
				__( 'Not authenticated.', 'patronraise-app' ),
				array( 'status' => 401 )
			);
		}
		return true;
	}

	/**
	 * Register all REST routes.
	 */
	public static function register_routes() {
		// Auth routes.
		register_rest_route( self::NAMESPACE, '/auth/login', array(
			'methods'             => 'POST',
			'callback'            => array( __CLASS__, 'handle_login' ),
			'permission_callback' => array( __CLASS__, 'verify_nonce' ),
		) );

		register_rest_route( self::NAMESPACE, '/auth/register', array(
			'methods'             => 'POST',
			'callback'            => array( __CLASS__, 'handle_register' ),
			'permission_callback' => array( __CLASS__, 'verify_nonce' ),
		) );

		register_rest_route( self::NAMESPACE, '/auth/logout', array(
			'methods'             => 'POST',
			'callback'            => array( __CLASS__, 'handle_logout' ),
			'permission_callback' => array( __CLASS__, 'verify_nonce' ),
		) );

		register_rest_route( self::NAMESPACE, '/auth/me', array(
			'methods'             => 'GET',
			'callback'            => array( __CLASS__, 'handle_me' ),
			'permission_callback' => array( __CLASS__, 'verify_authenticated_nonce' ),
		) );

		// Catch-all proxy route for all API paths.
		register_rest_route( self::NAMESPACE, '/proxy/(?P<path>.+)', array(
			array(
				'methods'             => 'GET',
				'callback'            => array( __CLASS__, 'handle_proxy' ),
				'permission_callback' => array( __CLASS__, 'verify_authenticated_nonce' ),
			),
			array(
				'methods'             => 'POST',
				'callback'            => array( __CLASS__, 'handle_proxy' ),
				'permission_callback' => array( __CLASS__, 'verify_authenticated_nonce' ),
			),
			array(
				'methods'             => 'PATCH',
				'callback'            => array( __CLASS__, 'handle_proxy' ),
				'permission_callback' => array( __CLASS__, 'verify_authenticated_nonce' ),
			),
			array(
				'methods'             => 'PUT',
				'callback'            => array( __CLASS__, 'handle_proxy' ),
				'permission_callback' => array( __CLASS__, 'verify_authenticated_nonce' ),
			),
			array(
				'methods'             => 'DELETE',
				'callback'            => array( __CLASS__, 'handle_proxy' ),
				'permission_callback' => array( __CLASS__, 'verify_authenticated_nonce' ),
			),
		) );
	}

	/**
	 * Handle login request.
	 *
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response|WP_Error
	 */
	public static function handle_login( WP_REST_Request $request ) {
		$email    = sanitize_email( $request->get_param( 'email' ) );
		$password = $request->get_param( 'password' );

		if ( empty( $email ) || empty( $password ) ) {
			return new WP_Error( 'missing_fields', __( 'Email and password are required.', 'patronraise-app' ), array( 'status' => 400 ) );
		}

		$result = PatronRaise_App_Auth_Bridge::login( $email, $password );

		if ( is_wp_error( $result ) ) {
			$status = 401;
			if ( 'not_configured' === $result->get_error_code() ) {
				$status = 500;
			}
			return new WP_Error( $result->get_error_code(), $result->get_error_message(), array( 'status' => $status ) );
		}

		return rest_ensure_response( $result );
	}

	/**
	 * Handle registration request.
	 *
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response|WP_Error
	 */
	public static function handle_register( WP_REST_Request $request ) {
		$data = array(
			'email'      => sanitize_email( $request->get_param( 'email' ) ),
			'password'   => $request->get_param( 'password' ),
			'first_name' => sanitize_text_field( $request->get_param( 'first_name' ) ),
			'last_name'  => sanitize_text_field( $request->get_param( 'last_name' ) ),
		);

		if ( empty( $data['email'] ) || empty( $data['password'] ) ) {
			return new WP_Error( 'missing_fields', __( 'Email and password are required.', 'patronraise-app' ), array( 'status' => 400 ) );
		}

		$result = PatronRaise_App_Auth_Bridge::register( $data );

		if ( is_wp_error( $result ) ) {
			return new WP_Error( $result->get_error_code(), $result->get_error_message(), array( 'status' => 400 ) );
		}

		$response = rest_ensure_response( $result );
		if ( $response instanceof WP_REST_Response ) {
			$response->set_status( 201 );
		}
		return $response;
	}

	/**
	 * Handle logout request.
	 *
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response
	 */
	public static function handle_logout( WP_REST_Request $request ) {
		PatronRaise_App_Auth_Bridge::logout();
		return rest_ensure_response( array( 'success' => true ) );
	}

	/**
	 * Handle /auth/me request.
	 *
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response|WP_Error
	 */
	public static function handle_me( WP_REST_Request $request ) {
		if ( ! PatronRaise_App_Auth_Bridge::is_authenticated() ) {
			return new WP_Error( 'not_authenticated', __( 'Not authenticated.', 'patronraise-app' ), array( 'status' => 401 ) );
		}

		$result = PatronRaise_App_Auth_Bridge::get_current_user();

		if ( is_wp_error( $result ) ) {
			return new WP_Error( $result->get_error_code(), $result->get_error_message(), array( 'status' => 401 ) );
		}

		return rest_ensure_response( $result );
	}

	/**
	 * Whitelisted route prefixes permitted through the API proxy.
	 */
	private static $allowed_prefixes = array(
		'patron-raise/',
		'organizations/',
		'events/',
		'campaigns/',
		'offers/',
		'v1/patron-raise/',
		'v1/organizations/',
		'v1/events/',
		'v1/campaigns/',
		'v1/offers/',
	);

	/**
	 * Validate and sanitize proxy path to prevent path traversal, SSRF, and unauthorized route access.
	 *
	 * @param string $path
	 * @return string|WP_Error
	 */
	public static function validate_path( $path ) {
		if ( empty( $path ) || ! is_string( $path ) ) {
			return new WP_Error( 'invalid_path', __( 'Proxy path cannot be empty.', 'patronraise-app' ), array( 'status' => 400 ) );
		}

		$decoded = rawurldecode( $path );
		// Block directory traversal, control characters, backslashes, and protocol schemes
		if (
			strpos( $path, '..' ) !== false ||
			strpos( $decoded, '..' ) !== false ||
			strpos( $path, '\\' ) !== false ||
			strpos( $decoded, '\\' ) !== false ||
			preg_match( '/[\x00-\x1F\x7F]/', $path ) ||
			preg_match( '#^(https?:)?//#i', $path )
		) {
			return new WP_Error( 'forbidden_path', __( 'Path traversal and URL schemes are forbidden.', 'patronraise-app' ), array( 'status' => 403 ) );
		}

		$normalized = ltrim( $path, '/' );
		$is_allowed = false;
		foreach ( self::$allowed_prefixes as $prefix ) {
			if ( strpos( $normalized, $prefix ) === 0 ) {
				$is_allowed = true;
				break;
			}
		}

		if ( ! $is_allowed ) {
			return new WP_Error( 'forbidden_path', __( 'Proxy path is not permitted.', 'patronraise-app' ), array( 'status' => 403 ) );
		}

		return $normalized;
	}

	/**
	 * Catch-all proxy handler — forwards requests to the canonical API.
	 *
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response|WP_Error
	 */
	public static function handle_proxy( WP_REST_Request $request ) {
		$raw_path = $request->get_param( 'path' );
		$path_check = self::validate_path( $raw_path );
		if ( is_wp_error( $path_check ) ) {
			$data = $path_check->get_error_data();
			$status = isset( $data['status'] ) ? $data['status'] : 403;
			return new WP_Error( $path_check->get_error_code(), $path_check->get_error_message(), array( 'status' => $status ) );
		}
		$path   = $path_check;
		$method = $request->get_method();

		// Build request body for write methods.
		$body = null;
		if ( in_array( $method, array( 'POST', 'PATCH', 'PUT' ), true ) ) {
			$body = $request->get_json_params();
			if ( empty( $body ) ) {
				$body = $request->get_body_params();
			}
		}

		// Forward query params for GET requests.
		if ( 'GET' === $method ) {
			$query_params = $request->get_query_params();
			// Remove WP internal params.
			unset( $query_params['rest_route'] );
			unset( $query_params['_wpnonce'] );

			if ( ! empty( $query_params ) ) {
				$path .= '?' . http_build_query( $query_params );
			}
		}

		// Forward tenant/org context headers from React.
		$extra_headers = array();
		$tenant_id = $request->get_header( 'x-tenant-id' );
		$org_id    = $request->get_header( 'x-organization-id' );

		if ( ! empty( $tenant_id ) ) {
			$extra_headers['x-tenant-id'] = sanitize_text_field( $tenant_id );
		}
		if ( ! empty( $org_id ) ) {
			$extra_headers['x-organization-id'] = sanitize_text_field( $org_id );
		}

		$result = PatronRaise_App_Auth_Bridge::authenticated_request( $method, $path, $body, $extra_headers );

		if ( is_wp_error( $result ) ) {
			$error_data = $result->get_error_data();
			$status     = isset( $error_data['status'] ) ? $error_data['status'] : 500;
			return new WP_Error( $result->get_error_code(), $result->get_error_message(), array( 'status' => $status ) );
		}

		return rest_ensure_response( $result );
	}
}

PatronRaise_App_API_Proxy::init();
