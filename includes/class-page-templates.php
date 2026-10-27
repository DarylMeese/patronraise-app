<?php
/**
 * PatronRaise Page Templates — registers the SPA page template and enqueues React.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class PatronRaise_App_Page_Templates {

	const TEMPLATE_SLUG = 'page-patronraise-app.php';

	/**
	 * Initialize hooks.
	 */
	public static function init() {
		add_filter( 'theme_page_templates', array( __CLASS__, 'add_template' ) );
		add_filter( 'template_include', array( __CLASS__, 'load_template' ) );
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
	}

	/**
	 * Add the PatronRaise App template to the page template dropdown.
	 *
	 * @param array $templates Existing page templates.
	 * @return array Modified templates.
	 */
	public static function add_template( $templates ) {
		$templates[ self::TEMPLATE_SLUG ] = __( 'PatronRaise App', 'patronraise-app' );
		return $templates;
	}

	/**
	 * Load the plugin's template file when selected.
	 *
	 * @param string $template Current template path.
	 * @return string Modified template path.
	 */
	public static function load_template( $template ) {
		if ( is_page() ) {
			$page_template = get_page_template_slug();
			if ( self::TEMPLATE_SLUG === $page_template ) {
				$plugin_template = PATRONRAISE_APP_PATH . 'templates/' . self::TEMPLATE_SLUG;
				if ( file_exists( $plugin_template ) ) {
					return $plugin_template;
				}
			}
		}
		return $template;
	}

	/**
	 * Enqueue the React SPA bundle only on PatronRaise App pages.
	 */
	public static function enqueue_assets() {
		if ( ! self::is_patronraise_page() ) {
			return;
		}

		$asset_file = PATRONRAISE_APP_PATH . 'build/index.asset.php';
		$deps       = array( 'wp-element' );
		$version    = PATRONRAISE_APP_VERSION;

		if ( file_exists( $asset_file ) ) {
			$asset   = require $asset_file;
			$deps    = $asset['dependencies'];
			$version = $asset['version'];
		}

		wp_enqueue_script(
			'patronraise-app',
			PATRONRAISE_APP_URL . 'build/index.js',
			$deps,
			$version,
			true
		);

		// Pass config to React.
		wp_localize_script( 'patronraise-app', 'patronraiseApp', array(
			'apiBase' => rest_url( 'patronraise-app/v1' ),
			'nonce'   => wp_create_nonce( 'wp_rest' ),
			'siteUrl' => home_url(),
		) );

		// Enqueue compiled CSS if it exists.
		$css_file = PATRONRAISE_APP_PATH . 'build/index.css';
		if ( file_exists( $css_file ) ) {
			wp_enqueue_style(
				'patronraise-app',
				PATRONRAISE_APP_URL . 'build/index.css',
				array(),
				$version
			);
		}

		// Enqueue additional plugin styles.
		$extra_css = PATRONRAISE_APP_PATH . 'build/style-index.css';
		if ( file_exists( $extra_css ) ) {
			wp_enqueue_style(
				'patronraise-app-style',
				PATRONRAISE_APP_URL . 'build/style-index.css',
				array(),
				$version
			);
		}
	}

	/**
	 * Check if the current page uses the PatronRaise App template.
	 *
	 * @return bool
	 */
	private static function is_patronraise_page() {
		if ( ! is_page() ) {
			return false;
		}
		return self::TEMPLATE_SLUG === get_page_template_slug();
	}
}

PatronRaise_App_Page_Templates::init();
