# CookiesRegTech for Sanity

Cookie consent banner with automatic tracker blocking, Google Consent Mode,
a cookie scanner, and a verifiable consent log, powered by
[CookiesRegTech](https://www.cookiesregtech.com).

Helps with GDPR, UK GDPR, CCPA/CPRA, LGPD, POPIA, and PIPEDA compliance.
Supports Sanity Studio v5 and v6.

## Installation

```sh
npm install sanity-plugin-cookiesregtech
# or: pnpm add sanity-plugin-cookiesregtech
# or: yarn add sanity-plugin-cookiesregtech
```

Add the plugin to your Studio configuration:

```ts
// sanity.config.ts
import {defineConfig} from 'sanity'
import {cookiesregtech} from 'sanity-plugin-cookiesregtech'

export default defineConfig({
  // ...
  plugins: [cookiesregtech()],
})
```

## Setup (one click)

1. In the Studio, open **Cookie Consent** in the top navigation bar.
2. Enter the public address of the website this Studio powers and the
   account email, tick the consent box, and press **Connect website**.
   A free account is created, the website is registered, and the consent
   banner is published. A sign-in link for the dashboard lands in the
   inbox.
3. Copy the one-line snippet the tool shows into the frontend app's HTML,
   right after the opening `<head>` tag and before Google Tag Manager or
   any analytics script.

If the email already has a CookiesRegTech account, a confirmation link is
sent to it instead. Click it, then press **Check status** in the tool.

## After connecting

The tool shows the connected website and the snippet to install, plus:

- **Open dashboard**: opens the CookiesRegTech dashboard already signed in
  (one-time sign-in link). Banner design, cookie scans, languages, and the
  consent log are managed there and publish to the site instantly, with no
  redeploy of the frontend.
- **Forget connection**: removes the connection from this browser only.
  The CookiesRegTech account, its data, and the banner on the site are
  unchanged.

## How it works

Sanity is headless, so the plugin cannot inject the banner into your
frontend by itself. The snippet is the only integration step. It loads a
single ~1KB script that should be the **first script in `<head>`**, ahead of
Google Tag Manager and analytics, so it can block known trackers and signal
Google Consent Mode before anything else runs.

The free plan includes a working banner, consent logging, and cookie scans.
Paid plans add scheduled full-site scans, geo-targeted banners, custom CSS,
and higher limits. Upgrades happen in the CookiesRegTech dashboard, never
inside this plugin.

## Privacy

The connection (the public Domain ID plus the secret used for signed-in
dashboard links) is stored in the `localStorage` of the Studio user's own
browser. Nothing secret ever reaches the published site, and each Studio
user connects separately.

## Development

```sh
yarn install
yarn build        # plugin-kit verify-package + pkg-utils build
yarn link-watch   # test against a local Studio
```

## License

[MIT](LICENSE) (c) Skynet Technologies USA LLC

## Support

- Website: <https://www.cookiesregtech.com>
- Email: <support@skynettechnologies.com>
