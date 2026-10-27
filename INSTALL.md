# PatronRaise App — Install & Run Instructions

## Prerequisites

- WordPress 6.0+
- PHP 7.4+
- Node.js 18+ and npm
- The **Attention Directory** plugin installed and activated with API credentials configured

## 1. Install Dependencies

```bash
cd apps/wordpress-plugin/plugins/patronraise-app
npm install
```

## 2. Build the React App

**Production build:**

```bash
npm run build
```

This compiles `src/index.tsx` into `build/index.js` and `build/index.css` using `@wordpress/scripts`.

**Development mode (live rebuild on file changes):**

```bash
npm start
```

## 3. Deploy to WordPress

Copy the three plugin folders into your WordPress installation:

```
wp-content/plugins/
├── attention-directory/
├── attention-patronraise/   (optional — read-only public display)
└── patronraise-app/
```

Only `attention-directory` and `patronraise-app` are required. The `attention-patronraise` extension is optional and independent.

## 4. Activate Plugins

1. Go to **Plugins** in wp-admin.
2. Activate **Attention Directory** first.
3. Configure API credentials at **Settings > Attention Directory** (API URL and API Key).
4. Activate **PatronRaise App**.

## 5. Create the App Page

1. Go to **Pages > Add New**.
2. Give it a title (e.g. "PatronRaise").
3. In the **Page Attributes** panel, set the template to **PatronRaise App**.
4. Publish the page.
5. Visit the page — the React SPA loads and shows the login screen.

## 6. Configure Settings (Optional)

Go to **Settings > PatronRaise App** to set:

- **Default Organization ID** — Pre-fills the organization context for users
- **Default Tenant ID** — Pre-fills the tenant context for campaigns

These are optional. Users can also set their organization context from the sidebar inside the app.

## Available npm Scripts

| Command          | Description                              |
|------------------|------------------------------------------|
| `npm run build`  | Production build to `build/`             |
| `npm start`      | Development mode with live rebuild       |
| `npm run lint:js`| Lint TypeScript/JSX files                |
| `npm run lint:css`| Lint CSS files                          |

## File Structure

```
patronraise-app/
├── patronraise-app.php              # Plugin bootstrap
├── includes/
│   ├── class-auth-bridge.php        # JWT session management
│   ├── class-api-proxy.php          # WP REST → Attention API proxy
│   ├── class-page-templates.php     # Registers SPA page template
│   └── class-settings.php           # Admin settings page
├── templates/
│   └── page-patronraise-app.php     # Page template (mounts React)
├── src/                             # React TypeScript source
│   ├── index.tsx                    # Entry point
│   ├── App.tsx                      # Router + auth provider
│   ├── api/client.ts                # API client (fetch wrapper)
│   ├── context/AuthContext.tsx       # Auth state management
│   ├── components/                  # Shared components
│   ├── pages/                       # Route pages (host/, beneficiary/, notifications/)
│   ├── styles/app.css               # Scoped application CSS
│   └── types/index.ts               # TypeScript type definitions
├── build/                           # Compiled output (gitignored)
├── package.json
├── tsconfig.json
└── readme.txt
```

## How Authentication Works

1. User submits email/password on the login page.
2. React calls `POST /wp-json/patronraise-app/v1/auth/login`.
3. WordPress PHP sends credentials to the Attention Network API.
4. API returns JWT tokens. PHP stores them in `$_SESSION` (never sent to browser).
5. Subsequent React API calls go through `/wp-json/patronraise-app/v1/proxy/{path}`.
6. PHP attaches the JWT `Authorization` header server-side before forwarding.
7. If the access token expires, the proxy auto-refreshes using the stored refresh token.

## Troubleshooting

**"Attention Directory plugin is required" error on activation**
- Activate `attention-directory` first, then activate `patronraise-app`.

**Blank page after navigating to the app page**
- Run `npm run build` — the `build/` folder must exist with compiled assets.
- Check browser console for JavaScript errors.

**API calls returning 401 or "not authenticated"**
- Verify API credentials in Settings > Attention Directory.
- Check that PHP sessions are working (some hosting configurations disable them).
- Try logging out and back in to establish a fresh session.

**Styles look broken or unstyled**
- Ensure `build/index.css` exists (re-run `npm run build`).
- Some themes may override styles — inspect for CSS specificity conflicts.
