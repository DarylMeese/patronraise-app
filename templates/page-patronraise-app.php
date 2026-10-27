<?php
/**
 * Template Name: PatronRaise App
 *
 * Minimal page template that renders the React SPA mount point.
 * WordPress header and footer are included for theme integration.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();
?>

<main id="patronraise-app" class="patronraise-app-root"></main>

<?php
get_footer();
