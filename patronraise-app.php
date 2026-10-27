<?php
/**
 * Plugin Name: PatronRaise App
 * Plugin URI: https://patronraise.com
 * Description: Full PatronRaise management application — fundraiser partnerships, offer management, availability calendars, and dashboards. Requires the Attention Directory plugin.
 * Version: 1.0.0
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Requires Plugins: attention-directory
 * Author: Attention Network
 * Author URI: https://attn.network
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: patronraise-app
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'PATRONRAISE_APP_VERSION', '1.0.0' );
define( 'PATRONRAISE_APP_PATH', plugin_dir_path( __FILE__ ) );
define( 'PATRONRAISE_APP_URL', plugin_dir_url( __FILE__ ) );
define( 'PATRONRAISE_APP_BASENAME', plugin_basename( __FILE__ ) );

/**
 * Activation hook — verify parent plugin is active.
 */
function patronraise_app_activate() {
	if ( ! function_exists( 'is_plugin_active' ) ) {
		include_once ABSPATH . 'wp-admin/includes/plugin.php';
	}

	if ( ! is_plugin_active( 'attention-directory/attention-directory.php' ) ) {
		deactivate_plugins( PATRONRAISE_APP_BASENAME );
		wp_die(
			esc_html__( 'PatronRaise App requires the Attention Directory plugin to be installed and active.', 'patronraise-app' ),
			esc_html__( 'Plugin Activation Error', 'patronraise-app' ),
			array( 'back_link' => true )
		);
	}
}
register_activation_hook( __FILE__, 'patronraise_app_activate' );

/**
 * Start PHP session early if needed with secure cookie attributes.
 * Required for JWT token storage.
 */
function patronraise_app_start_session() {
	if ( session_status() === PHP_SESSION_NONE && ! headers_sent() ) {
		// Only start session for PatronRaise routes to avoid global page-cache bypass
		$request_uri = isset( $_SERVER['REQUEST_URI'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '';
		$is_patronraise_req = ( strpos( $request_uri, 'patronraise' ) !== false || strpos( $request_uri, 'wp-json/patronraise' ) !== false );
		if ( ! $is_patronraise_req && ! is_admin() ) {
			return;
		}

		session_set_cookie_params( array(
			'lifetime' => 0,
			'path'     => '/',
			'domain'   => '',
			'secure'   => is_ssl(),
			'httponly' => true,
			'samesite' => 'Lax',
		) );
		session_start();
	}
}
add_action( 'init', 'patronraise_app_start_session', 1 );

/**
 * Initialize plugin modules after parent plugin has loaded.
 * Priority 20 ensures attention-directory loads first.
 */
function patronraise_app_init() {
	if ( ! function_exists( 'attention_directory_init' ) ) {
		add_action( 'admin_notices', 'patronraise_app_missing_parent_notice' );
		return;
	}

	require_once PATRONRAISE_APP_PATH . 'includes/class-auth-bridge.php';
	require_once PATRONRAISE_APP_PATH . 'includes/class-api-proxy.php';
	require_once PATRONRAISE_APP_PATH . 'includes/class-page-templates.php';
	require_once PATRONRAISE_APP_PATH . 'includes/class-settings.php';
	require_once PATRONRAISE_APP_PATH . 'includes/class-push.php';
}
add_action( 'plugins_loaded', 'patronraise_app_init', 20 );

/**
 * Admin notice when parent plugin is missing.
 */
function patronraise_app_missing_parent_notice() {
	?>
	<div class="notice notice-warning">
		<p>
			<strong><?php esc_html_e( 'PatronRaise App', 'patronraise-app' ); ?>:</strong>
			<?php esc_html_e( 'The Attention Directory plugin is required but not active. PatronRaise App is disabled.', 'patronraise-app' ); ?>
		</p>
	</div>
	<?php
}
