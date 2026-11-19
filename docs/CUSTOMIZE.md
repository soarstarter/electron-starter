# Customizing This Template

Two jobs turn the template into your app: give it your brand, then remove the Showcase. Do them in that order; the
brand change is small and easy to check on its own.

## Rebrand

Brand identity lives in `shared/constants.ts`. Both Electron processes and the renderer read it, so changing it there
updates the window title, About page, Help links, mailto subjects, and the deep-link scheme in code.

| What                       | Where                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------- |
| App id, name, slug, scheme | `APP_ID`, `APP_NAME`, `PRODUCT_SLUG`, `PROTOCOL_SCHEME` in `shared/constants.ts`                        |
| Support and project links  | `SUPPORT_EMAIL`, `REPO_URL`, `HOMEPAGE_URL`, `LICENSE_URL` in `shared/constants.ts`                     |
| Optional EULA gate         | `EULA_URL` and `EULA_VERSION` in `shared/constants.ts`                                                  |
| Packaging                  | `appId`, `productName`, `protocols`, `win.executableName`, `linux.maintainer` in `electron-builder.yml` |
| npm metadata               | `name`, `version`, `description`, `author`, `homepage`, `repository`, `bugs` in `package.json`          |
| Window title before load   | `<title>` in `app/index.html`                                                                           |
| Display name in the UI     | `appName` in `app/locales/*/common.json`                                                                |
| Icons                      | `resources/build/` — see [APP_ICONS.md](APP_ICONS.md)                                                   |
| Deep-link examples         | `app/routes/showcase/demos/DeepLinksDemo.tsx` and `lib/main/argv-intents.test.ts`                       |

`electron-builder.yml` and `package.json` cannot import TypeScript, so keep their values in sync with
`shared/constants.ts` by hand. Electron stores settings in a folder named after the app (`productName` in packaged
builds, the `package.json` `name` in development), so renaming either gives the renamed build fresh settings.

Check the result with `pnpm dev` (window title, About, Help links) and `pnpm build:unpack` (bundle name, protocol
registration).

## Remove the Showcase

1. Set both showcase flags to `false`:

   ```sh
   VITE_SHOWCASE_ENABLED=false
   MAIN_VITE_SHOWCASE_ENABLED=false
   ```

   `VITE_SHOWCASE_ENABLED` controls renderer routes, sidebar, Home, and command-palette surfaces.
   `MAIN_VITE_SHOWCASE_ENABLED` controls the native Template menu. Keep the values matched so main and renderer chrome
   agree.

2. Run the app and confirm the Template zone, Showcase routes, palette showcase group, Template menu, and Home showcase
   sections are hidden.

3. Delete the demo-only folders. `app/showcase/` also holds `pro-catalog.ts`, the list of commercial-edition
   capabilities shown at the end of the Showcase, so it goes with the rest:

   ```sh
   rm -rf app/routes/showcase app/showcase
   ```

4. Remove the small `[template-demo]` touchpoints from core files:
   - The `features.showcase` route block and showcase lazy imports in `app/app.tsx`.
   - The `template` sidebar group in `app/components/layout/sidebar-items.ts`.
   - The `showcaseSource` source and catalog import in `app/components/command-palette/command-sources.ts`, plus the
     `showcaseEnabled` context and showcase group wiring in `app/components/command-palette/CommandPalette.tsx`.
   - The Showcase-derived Home sections and catalog imports in `app/routes/HomePage.tsx`.
   - The Template menu block in `lib/main/menu.ts`.
   - The showcase flag plumbing in `shared/config.ts`, `lib/main/feature-flags.ts`, and `lib/main/main.ts`.
   - The `/showcase*` route entries in `lib/conveyor/schemas/event-schema.ts`.
   - The showcase locale imports and namespace registration in `app/lib/i18n/resources.ts`.
   - The `VITE_SHOWCASE_ENABLED` env type in `app/index.d.ts`.
   - Showcase-specific tests in `shared/config.test.ts`, `lib/main/feature-flags.test.ts`, `lib/main/menu.test.ts`,
     `lib/main/argv-intents.test.ts`, `app/components/layout/sidebar-items.test.ts`, and
     `app/components/command-palette/command-sources.test.ts`.
   - Showcase-facing labels in `app/locales/*/common.json` once no remaining UI reads them.

5. Delete the showcase locale files:

   ```sh
   rm app/locales/en/showcase.json app/locales/zh/showcase.json
   ```

6. Add your product pages to the `workspace` sidebar group and register their routes in `app/app.tsx`.

7. Run the full verification pass:

   ```sh
   pnpm format:check
   pnpm lint:check
   pnpm typecheck
   pnpm test:unit
   ```

## Audit Helper

Search for the marker to find demo-related leftovers:

```sh
rg "template-demo"
```
