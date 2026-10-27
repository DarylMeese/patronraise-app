# PatronRaise App — WordPress Management Application

[![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)](patronraise-app.php)
[![License](https://img.shields.io/badge/license-GPLv2-green.svg)](LICENSE)
[![PHP](https://img.shields.io/badge/PHP-7.4%2B-purple.svg)](https://php.net)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev)
[![WordPress](https://img.shields.io/badge/WordPress-6.0%2B-0073aa.svg)](https://wordpress.org)

**PatronRaise App** embeds the complete PatronRaise fundraising and partnership management application directly inside WordPress as a native, single-page React app (without iframes). It connects non-profit organizations, sports teams, schools, and civic causes with local business partners for fundraising deals and donor passes.

---

## 🌟 Key Capabilities

### 1. Zero-Iframe React SPA Architecture
- Mounts directly into WordPress page templates (`page-patronraise-app.php`) targeting `#patronraise-app-root`.
- Full React 18 / TypeScript frontend with responsive tabs for campaigns, donor passes, business partnership offers, and analytics.

### 2. Secure Auth Bridge & JWT Token Storage
- Bridges WordPress user authentication to Attention Platform JWT sessions.
- Sessions are strictly gated to PatronRaise routes with `secure`, `httponly`, and `SameSite=Lax` cookies, avoiding unnecessary global page-cache bypass.

### 3. REST API Proxy
- Proxies requests to `/wp-json/patronraise/v1/*` with strict path traversal whitelisting and input sanitization to ensure security.

### 4. Attention Push Integration (Gravitec)
- Allows supporters and donors to subscribe to real-time campaign milestones, goal updates, and fundraising events.
- **Shortcode**: `[patronraise_push_prompt campaign_id="..." campaign_name="..."]`

---

## 📦 Installation & Setup

1. **Prerequisite**: Requires the **Attention Directory** plugin to be active for credential sharing.
2. Clone into your WordPress plugins directory:
   ```bash
   cd wp-content/plugins/
   git clone https://github.com/DarylMeese/patronraise-app.git
   ```
3. Install dependencies and compile the React bundle:
   ```bash
   npm install
   npm run build
   ```
4. Activate **PatronRaise App** in WordPress Admin (**Plugins** -> **Installed Plugins**).
5. Create a new WordPress Page (e.g. titled "PatronRaise Dashboard") and select the **PatronRaise App** page template in Page Attributes.

---

## 📄 License

Licensed under the GNU General Public License v2 (or later).
Copyright © 2026 Attention Network.
