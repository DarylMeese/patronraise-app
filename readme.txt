=== PatronRaise App ===
Contributors: attentionnetwork
Tags: fundraising, events, patronraise, attention network, management
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Full management application for PatronRaise fundraising partnerships. Requires the Attention Directory plugin.

== Description ==

PatronRaise App is a React single-page application embedded in WordPress that provides the complete management experience for PatronRaise fundraising partnerships.

**For Hosts (businesses):**

* Create and manage fundraising offers
* Set weekly availability schedules with date overrides
* Review and approve partnership requests
* Track upcoming events
* Submit post-event reports with financial data

**For Beneficiaries (nonprofits/schools):**

* Browse published host offers
* Submit partnership requests via a guided wizard
* Track request status and approvals
* View upcoming fundraising events

**General features:**

* Secure authentication via the Attention Network API
* Organization context switching
* Dashboard with summary statistics
* Notification center (pending API support)

This plugin uses a server-side API proxy to keep authentication tokens secure. JWT tokens are stored in the PHP session and never exposed to the browser.

== Requirements ==

* WordPress 6.0 or higher
* PHP 7.4 or higher
* Node.js 18+ (for building the React app)
* Attention Directory plugin (must be installed and active)

== Installation ==

1. Install and activate the Attention Directory plugin first.
2. Configure API credentials in Settings > Attention Directory.
3. Upload `patronraise-app` to the `/wp-content/plugins/` directory.
4. Run `npm install && npm run build` inside the plugin directory.
5. Activate the plugin through the Plugins menu.
6. Create a WordPress page and assign the "PatronRaise App" page template.
7. Visit the page to access the application.

== Setup ==

= Page Template =

Create any WordPress page and set its template to "PatronRaise App" from the Page Attributes panel. The React SPA will render on that page.

= Settings =

Go to Settings > PatronRaise App to configure:

* **Default Organization ID** — Pre-select an organization context
* **Default Tenant ID** — Pre-select a tenant context

= Building the React App =

From the plugin directory:

`
cd wp-content/plugins/patronraise-app
npm install
npm run build
`

For development with live rebuilds:

`
npm start
`

== Architecture ==

= Security Model =

* JWT tokens are stored server-side in PHP sessions, never sent to the browser
* All API calls from React go through WordPress REST endpoints with WP nonce verification
* The server-side proxy attaches authentication headers before forwarding to the Attention Network API
* Session IDs are regenerated on login to prevent session fixation

= Routing =

The app uses hash-based routing (`/#/login`, `/#/host/offers`, etc.) to avoid conflicts with WordPress permalink structures.

= API Proxy =

A catch-all WordPress REST route at `/patronraise-app/v1/proxy/(.+)` forwards requests to the Attention Network API. This handles CORS and keeps API credentials server-side.

== Frequently Asked Questions ==

= Does this plugin require the read-only PatronRaise extension? =

No. The `attention-patronraise` (read-only display) and `patronraise-app` (full management) plugins are independent. Both require `attention-directory` as a base. You can install one or both.

= Why does the URL have a hash (#) in it? =

The app uses hash routing to work with any WordPress permalink structure without custom rewrite rules.

= Can I customize the appearance? =

Yes. The app uses CSS custom properties scoped under `.patronraise-app-root`. Override these in your theme:

`
.patronraise-app-root {
    --pr-app-primary: #your-color;
    --pr-app-sidebar-bg: #your-color;
}
`

== Changelog ==

= 1.0.0 =
* Initial release
* Host offer management (create, edit, archive)
* Weekly availability scheduling with date overrides
* Calendar availability preview
* Beneficiary offer search and request wizard
* Partnership approval and negotiation workflow
* Host and beneficiary dashboards with statistics
* Post-event reporting with finalization
* Notification center (stubbed, pending API endpoints)
* Responsive design for mobile and desktop
