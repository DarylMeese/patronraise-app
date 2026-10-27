<?php
/**
 * PatronRaise App — Attention Push Integration
 *
 * Provides web push subscription prompts for fundraising campaign milestones,
 * donor updates, and partnership announcements via Attention Push (Gravitec).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class PatronRaise_App_Push {

	public static function init() {
		add_shortcode( 'patronraise_push_prompt', array( __CLASS__, 'render_push_prompt_shortcode' ) );
	}

	/**
	 * Render [patronraise_push_prompt] shortcode
	 */
	public static function render_push_prompt_shortcode( $atts ) {
		$atts = shortcode_atts( array(
			'campaign_id'   => '',
			'campaign_name' => '',
			'button_text'   => __( 'Subscribe to Campaign Alerts', 'patronraise-app' ),
			'class'         => '',
		), $atts, 'patronraise_push_prompt' );

		// Retrieve Attention Push App ID from parent attention-directory or local option
		$app_id = get_option( 'attention_directory_push_app_id', '' );
		if ( empty( $app_id ) ) {
			$app_id = get_option( 'attention_network_push_app_id', '' );
		}

		if ( empty( $app_id ) ) {
			return '';
		}

		// Ensure client script is enqueued
		wp_enqueue_script(
			'attention-push-client',
			'https://cdn.gravitec.net/storage/' . esc_attr( $app_id ) . '/client.js',
			array(),
			null,
			true
		);

		$campaign_id   = sanitize_text_field( $atts['campaign_id'] );
		$campaign_name = sanitize_text_field( $atts['campaign_name'] );
		$tag           = ! empty( $campaign_id ) ? 'campaign_' . $campaign_id : 'patronraise_donor';

		ob_start();
		?>
		<div class="patronraise-push-wrap <?php echo esc_attr( $atts['class'] ); ?>" style="margin: 16px 0;">
			<button
				type="button"
				class="button button-primary patronraise-push-btn"
				onclick="window.attnSubscribeToCampaign('<?php echo esc_js( $tag ); ?>');"
				style="display: inline-flex; align-items: center; gap: 8px; font-weight: 600; padding: 10px 18px; border-radius: 8px;"
			>
				<span style="font-size: 16px;">🔔</span> <?php echo esc_html( $atts['button_text'] ); ?>
			</button>
		</div>

		<script>
		window.attnSubscribeToCampaign = window.attnSubscribeToCampaign || function(tag) {
			if (window.Gravitec) {
				window.Gravitec.push(['prompt', function(status) {
					if (status === 'granted' && window.Gravitec.addTag) {
						window.Gravitec.addTag(tag);
					}
				}]);
			} else {
				alert('<?php echo esc_js( __( 'Attention Push notification service initializing...', 'patronraise-app' ) ); ?>');
			}
		};
		</script>
		<?php
		return ob_get_clean();
	}
}

PatronRaise_App_Push::init();
