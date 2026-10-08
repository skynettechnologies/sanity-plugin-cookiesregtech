import {definePlugin} from 'sanity'

import {CookiesRegTechIcon, CookiesRegTechTool} from './CookiesRegTechTool'

/**
 * CookiesRegTech cookie consent for Sanity.
 *
 * Adds a "Cookie Consent" tool to the Studio: guided account creation for
 * the site the Studio powers, then the exact snippet the frontend needs.
 * Sanity is headless, so the plugin cannot inject the banner itself - the
 * tool produces the one-line script tag for the frontend app instead.
 *
 * Usage in `sanity.config.ts` (or .js)
 *
 * ```ts
 * import {defineConfig} from 'sanity'
 * import {cookiesregtech} from 'sanity-plugin-cookiesregtech'
 *
 * export default defineConfig({
 *   // ...
 *   plugins: [cookiesregtech()],
 * })
 * ```
 *
 * @public
 */
export const cookiesregtech = definePlugin(() => {
  return {
    name: 'sanity-plugin-cookiesregtech',
    tools: [
      {
        name: 'cookiesregtech',
        title: 'Cookie Consent',
        icon: CookiesRegTechIcon,
        component: CookiesRegTechTool,
      },
    ],
  }
})
