<?php
/**
 * PatronRaise App Settings — admin settings for the management application.
 *
 * API credentials are managed by the parent Attention Directory plugin.
 * This page handles PatronRaise App-specific configuration only.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class PatronRaise_App_Settings {

	/**
	 * Initialize hooks.
	 */
	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'add_menu_page' ) );
		add_action( 'admin_init', array( __CLASS__, 'register_settings' ) );
	}

	/**
	 * Add submenu page under Settings.
	 */
	public static function add_menu_page() {
		add_options_page(
			__( 'PatronRaise App Settings', 'patronraise-app' ),
			__( 'PatronRaise App', 'patronraise-app' ),
			'manage_options',
			'patronraise-app-settings',
			array( __CLASS__, 'render_settings_page' )
		);
	}

	/**
	 * Register settings.
	 */
	public static function register_settings() {
		register_setting( 'patronraise_app_settings', 'patronraise_app_default_org_id', array(
			'sanitize_callback' => 'sanitize_text_field',
			'default'           => '',
		) );

		register_setting( 'patronraise_app_settings', 'patronraise_app_default_tenant_id', array(
			'sanitize_callback' => 'sanitize_text_field',
			'default'           => '',
		) );
	}

	/**
	 * Render the settings page.
	 */
	public static function render_settings_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		$default_org_id    = get_option( 'patronraise_app_default_org_id', '' );
		$default_tenant_id = get_option( 'patronraise_app_default_tenant_id', '' );

		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'PatronRaise App Settings', 'patronraise-app' ); ?></h1>

			<p class="description">
				<?php
				printf(
					/* translators: %s: link to Attention Directory settings */
					esc_html__( 'API credentials are managed in %s.', 'patronraise-app' ),
					'<a href="' . esc_url( admin_url( 'options-general.php?page=attention-directory' ) ) . '">'
						. esc_html__( 'Attention Directory settings', 'patronraise-app' )
						. '</a>'
				);
				?>
			</p>

			<?php settings_errors( 'patronraise_app_settings' ); ?>

			<form method="post" action="options.php">
				<?php settings_fields( 'patronraise_app_settings' ); ?>

				<table class="form-table" role="presentation">
					<tr>
						<th scope="row">
							<label for="patronraise_app_default_org_id">
								<?php esc_html_e( 'Default Organization ID', 'patronraise-app' ); ?>
							</label>
						</th>
						<td>
							<input
								type="text"
								id="patronraise_app_default_org_id"
								name="patronraise_app_default_org_id"
								value="<?php echo esc_attr( $default_org_id ); ?>"
								class="regular-text"
							/>
							<p class="description">
								<?php esc_html_e( 'Default organization context for the app.', 'patronraise-app' ); ?>
							</p>
						</td>
					</tr>

					<tr>
						<th scope="row">
							<label for="patronraise_app_default_tenant_id">
								<?php esc_html_e( 'Default Tenant ID', 'patronraise-app' ); ?>
							</label>
						</th>
						<td>
							<input
								type="text"
								id="patronraise_app_default_tenant_id"
								name="patronraise_app_default_tenant_id"
								value="<?php echo esc_attr( $default_tenant_id ); ?>"
								class="regular-text"
							/>
							<p class="description">
								<?php esc_html_e( 'Default tenant context for campaigns and partnerships.', 'patronraise-app' ); ?>
							</p>
						</td>
					</tr>
				</table>

				<?php submit_button(); ?>
			</form>
		</div>
		<?php
	}
}

PatronRaise_App_Settings::init();
