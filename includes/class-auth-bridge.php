<?php
/**
 * PatronRaise Auth Bridge — manages JWT session lifecycle.
 *
 * Authenticates against the Attention Network API and stores JWT tokens
 * in PHP session. Tokens never reach the browser.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class PatronRaise_App_Auth_Bridge {

	const SESSION_ACCESS_TOKEN  = 'patronraise_jwt_access';
	const SESSION_REFRESH_TOKEN = 'patronraise_jwt_refresh';
	const LOGIN_RATE_LIMIT_MAX  = 5;
	const LOGIN_RATE_LIMIT_TTL  = 900; // 15 minutes

	/**
	 * Safely retrieve and validate the direct client remote IP address.
	 *
	 * @return string|null Validated IP address or null.
	 */
	public static function get_client_ip() {
		if ( empty( $_SERVER['REMOTE_ADDR'] ) ) {
			return null;
		}
		$ip = sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) );
		return filter_var( $ip, FILTER_VALIDATE_IP ) ? $ip : null;
	}

	/**
	 * Build standard headers including validated client IP when available.
	 *
	 * @param array $base_headers Base headers.
	 * @return array Headers with client IP forwarded.
	 */
	private static function with_client_ip_headers( $base_headers = array() ) {
		$client_ip = self::get_client_ip();
		if ( ! empty( $client_ip ) ) {
			$base_headers['X-Forwarded-For'] = $client_ip;
			$base_headers['X-Real-IP']       = $client_ip;
		}
		return $base_headers;
	}

	/**
	 * Login via the canonical API.
	 *
	 * @param string $email    User email.
	 * @param string $password User password.
	 * @return array|WP_Error  User profile on success, WP_Error on failure.
	 */
	public static function login( $email, $password ) {
		$base_url = get_option( 'attention_directory_base_url', '' );

		if ( empty( $base_url ) || ! filter_var( $base_url, FILTER_VALIDATE_URL ) ) {
			return new WP_Error( 'not_configured', __( 'API is not configured.', 'patronraise-app' ) );
		}

		// Rate-limit failed login attempts per client IP + email before hitting platform API.
		$client_ip = self::get_client_ip();
		$rl_key    = 'pr_login_rl_' . md5( ( $client_ip ? $client_ip : 'unknown' ) . '|' . strtolower( $email ) );
		$attempts  = (int) get_transient( $rl_key );
		if ( $attempts >= self::LOGIN_RATE_LIMIT_MAX ) {
			return new WP_Error( 'rate_limited', __( 'Too many login attempts. Please try again later.', 'patronraise-app' ) );
		}

		$response = wp_remote_post( trailingslashit( $base_url ) . 'auth/login', array(
			'timeout' => 15,
			'headers' => self::with_client_ip_headers( array(
				'Content-Type' => 'application/json',
				'Accept'       => 'application/json',
			) ),
			'body'    => wp_json_encode( array(
				'email'    => $email,
				'password' => $password,
			) ),
		) );

		if ( is_wp_error( $response ) ) {
			error_log( 'PatronRaise login error: ' . $response->get_error_message() );
			return new WP_Error( 'login_failed', __( 'Unable to connect to the authentication service.', 'patronraise-app' ) );
		}

		$code = wp_remote_retrieve_response_code( $response );

		if ( 401 === $code ) {
			set_transient( $rl_key, $attempts + 1, self::LOGIN_RATE_LIMIT_TTL );
			return new WP_Error( 'invalid_credentials', __( 'Invalid email or password.', 'patronraise-app' ) );
		}

		if ( $code < 200 || $code >= 300 ) {
			set_transient( $rl_key, $attempts + 1, self::LOGIN_RATE_LIMIT_TTL );
			return new WP_Error( 'login_failed', __( 'Authentication failed.', 'patronraise-app' ) );
		}

		delete_transient( $rl_key );

		// Extract JWT tokens from response cookies.
		$cookies = wp_remote_retrieve_cookies( $response );
		self::store_tokens_from_cookies( $cookies );

		// Regenerate session ID to prevent session fixation.
		session_regenerate_id( true );

		// Fetch the user profile.
		return self::get_current_user();
	}

	/**
	 * Register a new user via the canonical API.
	 *
	 * @param array $data Registration data (email, password, first_name, last_name).
	 * @return array|WP_Error User data on success, WP_Error on failure.
	 */
	public static function register( $data ) {
		$base_url = get_option( 'attention_directory_base_url', '' );

		if ( empty( $base_url ) || ! filter_var( $base_url, FILTER_VALIDATE_URL ) ) {
			return new WP_Error( 'not_configured', __( 'API is not configured.', 'patronraise-app' ) );
		}

		$client_ip = self::get_client_ip();
		$rl_key    = 'pr_reg_rl_' . md5( $client_ip ? $client_ip : 'unknown' );
		$attempts  = (int) get_transient( $rl_key );
		if ( $attempts >= self::LOGIN_RATE_LIMIT_MAX ) {
			return new WP_Error( 'rate_limited', __( 'Too many registration attempts. Please try again later.', 'patronraise-app' ) );
		}
		set_transient( $rl_key, $attempts + 1, self::LOGIN_RATE_LIMIT_TTL );

		$response = wp_remote_post( trailingslashit( $base_url ) . 'auth/register', array(
			'timeout' => 15,
			'headers' => self::with_client_ip_headers( array(
				'Content-Type' => 'application/json',
				'Accept'       => 'application/json',
			) ),
			'body'    => wp_json_encode( $data ),
		) );

		if ( is_wp_error( $response ) ) {
			return new WP_Error( 'register_failed', __( 'Unable to connect to the registration service.', 'patronraise-app' ) );
		}

		$code = wp_remote_retrieve_response_code( $response );
		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( $code < 200 || $code >= 300 ) {
			$message = isset( $body['message'] ) ? $body['message'] : __( 'Registration failed.', 'patronraise-app' );
			return new WP_Error( 'register_failed', $message );
		}

		return $body;
	}

	/**
	 * Logout — clear session tokens.
	 */
	public static function logout() {
		$base_url     = get_option( 'attention_directory_base_url', '' );
		$access_token = self::get_access_token();

		// Best-effort API logout.
		if ( ! empty( $base_url ) && ! empty( $access_token ) ) {
			wp_remote_post( trailingslashit( $base_url ) . 'auth/logout', array(
				'timeout' => 5,
				'headers' => self::with_client_ip_headers( array(
					'Authorization' => 'Bearer ' . $access_token,
					'Accept'        => 'application/json',
				) ),
			) );
		}

		unset( $_SESSION[ self::SESSION_ACCESS_TOKEN ] );
		unset( $_SESSION[ self::SESSION_REFRESH_TOKEN ] );
	}

	/**
	 * Refresh the access token using the stored refresh token.
	 *
	 * @return bool True on success, false on failure.
	 */
	public static function refresh() {
		$base_url      = get_option( 'attention_directory_base_url', '' );
		$refresh_token = self::get_refresh_token();

		if ( empty( $base_url ) || empty( $refresh_token ) ) {
			return false;
		}

		$response = wp_remote_post( trailingslashit( $base_url ) . 'auth/refresh', array(
			'timeout' => 10,
			'headers' => self::with_client_ip_headers( array(
				'Accept' => 'application/json',
			) ),
			'cookies' => array(
				new WP_Http_Cookie( array(
					'name'  => 'refresh_token',
					'value' => $refresh_token,
				) ),
			),
		) );

		if ( is_wp_error( $response ) ) {
			return false;
		}

		$code = wp_remote_retrieve_response_code( $response );

		if ( $code < 200 || $code >= 300 ) {
			// Refresh failed — session is expired.
			self::logout();
			return false;
		}

		// Store new access token from response cookies.
		$cookies = wp_remote_retrieve_cookies( $response );
		self::store_tokens_from_cookies( $cookies );

		return true;
	}

	/**
	 * Get the current user profile from the API.
	 *
	 * @return array|WP_Error User profile or WP_Error.
	 */
	public static function get_current_user() {
		$result = self::authenticated_request( 'GET', 'auth/me' );
		return $result;
	}

	/**
	 * Check if user is authenticated (has a stored access token).
	 *
	 * @return bool
	 */
	public static function is_authenticated() {
		return ! empty( self::get_access_token() );
	}

	/**
	 * Get stored access token.
	 *
	 * @return string|null
	 */
	public static function get_access_token() {
		return isset( $_SESSION[ self::SESSION_ACCESS_TOKEN ] ) ? $_SESSION[ self::SESSION_ACCESS_TOKEN ] : null;
	}

	/**
	 * Get stored refresh token.
	 *
	 * @return string|null
	 */
	private static function get_refresh_token() {
		return isset( $_SESSION[ self::SESSION_REFRESH_TOKEN ] ) ? $_SESSION[ self::SESSION_REFRESH_TOKEN ] : null;
	}

	/**
	 * Make an authenticated request to the API.
	 * Auto-refreshes the access token on 401.
	 *
	 * @param string $method HTTP method (GET, POST, PATCH, DELETE).
	 * @param string $path   API path.
	 * @param array  $body   Request body (for POST/PATCH).
	 * @param array  $extra_headers Additional headers.
	 * @return array|WP_Error Decoded JSON response.
	 */
	public static function authenticated_request( $method, $path, $body = null, $extra_headers = array() ) {
		$base_url     = get_option( 'attention_directory_base_url', '' );
		$access_token = self::get_access_token();

		if ( empty( $base_url ) || ! filter_var( $base_url, FILTER_VALIDATE_URL ) ) {
			return new WP_Error( 'not_configured', __( 'API is not configured.', 'patronraise-app' ) );
		}

		$result = self::do_request( $method, $base_url, $path, $access_token, $body, $extra_headers );

		// On 401, try refreshing the token and retrying once.
		if ( is_wp_error( $result ) && 'api_unauthorized' === $result->get_error_code() ) {
			if ( self::refresh() ) {
				$access_token = self::get_access_token();
				$result       = self::do_request( $method, $base_url, $path, $access_token, $body, $extra_headers );
			}
		}

		return $result;
	}

	/**
	 * Execute a single HTTP request to the API.
	 *
	 * @param string      $method        HTTP method.
	 * @param string      $base_url      API base URL.
	 * @param string      $path          API path.
	 * @param string|null $access_token  Bearer token.
	 * @param array|null  $body          Request body.
	 * @param array       $extra_headers Additional headers.
	 * @return array|WP_Error Decoded JSON or WP_Error.
	 */
	private static function do_request( $method, $base_url, $path, $access_token, $body = null, $extra_headers = array() ) {
		$url = trailingslashit( $base_url ) . ltrim( $path, '/' );

		$headers = self::with_client_ip_headers( array_merge( array(
			'Accept'       => 'application/json',
			'Content-Type' => 'application/json',
		), $extra_headers ) );

		if ( ! empty( $access_token ) ) {
			$headers['Authorization'] = 'Bearer ' . $access_token;
		}

		$args = array(
			'method'  => strtoupper( $method ),
			'timeout' => 15,
			'headers' => $headers,
		);

		if ( null !== $body && in_array( strtoupper( $method ), array( 'POST', 'PATCH', 'PUT' ), true ) ) {
			$args['body'] = is_string( $body ) ? $body : wp_json_encode( $body );
		}

		$response = wp_remote_request( $url, $args );

		if ( is_wp_error( $response ) ) {
			error_log( 'PatronRaise API error: ' . $response->get_error_message() );
			return new WP_Error( 'api_error', __( 'Unable to reach the API.', 'patronraise-app' ) );
		}

		$code      = wp_remote_retrieve_response_code( $response );
		$resp_body = wp_remote_retrieve_body( $response );

		if ( 401 === $code ) {
			return new WP_Error( 'api_unauthorized', __( 'Unauthorized.', 'patronraise-app' ), array( 'status' => 401 ) );
		}

		if ( 204 === $code ) {
			return array( 'success' => true );
		}

		$data = json_decode( $resp_body, true );

		if ( $code < 200 || $code >= 300 ) {
			$message = isset( $data['message'] ) ? $data['message'] : 'HTTP ' . $code;
			return new WP_Error( 'api_error', $message, array( 'status' => $code ) );
		}

		return $data;
	}

	/**
	 * Extract and store JWT tokens from API response cookies.
	 *
	 * @param WP_Http_Cookie[] $cookies Response cookies.
	 */
	private static function store_tokens_from_cookies( $cookies ) {
		foreach ( $cookies as $cookie ) {
			if ( 'access_token' === $cookie->name && ! empty( $cookie->value ) ) {
				$_SESSION[ self::SESSION_ACCESS_TOKEN ] = $cookie->value;
			}
			if ( 'refresh_token' === $cookie->name && ! empty( $cookie->value ) ) {
				$_SESSION[ self::SESSION_REFRESH_TOKEN ] = $cookie->value;
			}
		}
	}
}
