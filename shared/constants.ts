// Single source of truth for the product's brand identity. Both Electron
// processes and the renderer import from here instead of hardcoding strings, so
// rebranding the template is a one-file change in code. Keep the static config
// that can't import TypeScript (electron-builder.yml, package.json) in sync by
// hand — see docs/CUSTOMIZE.md.

/** Reverse-DNS application identifier (electron-builder `appId`). */
export const APP_ID = 'com.soarstarter.electron-starter'

/**
 * Windows AppUserModelID — pinned to {@link APP_ID} so taskbar grouping and
 * toast notifications resolve to the same identity as the installer.
 */
export const APP_USER_MODEL_ID = APP_ID

/** Human-readable product name (window title, About, mailto subjects, installer). */
export const APP_NAME = 'Electron Starter'

/**
 * Packaging slug: npm `name`, electron-builder `productName` / executable name,
 * and artifact file names. Lowercase, no spaces.
 */
export const PRODUCT_SLUG = 'electron-starter'

/** Custom URL scheme for deep links (`electron-starter://settings`, `electron-starter://about`, …). */
export const PROTOCOL_SCHEME = 'electron-starter'

/** Display name registered for the protocol handler (electron-builder `protocols.name`). */
export const PROTOCOL_NAME = APP_NAME

/** Support inbox used by the Help page "Send feedback" action. */
export const SUPPORT_EMAIL = 'contact@soarstarter.com'

/** Source repository; the bug-report flow targets `${REPO_URL}/issues/new`. */
export const REPO_URL = 'https://github.com/soarstarter/electron-starter'

/** Product homepage / documentation entry point. */
export const HOMEPAGE_URL = 'https://github.com/soarstarter/electron-starter'

/** License document link shown on the About page. */
export const LICENSE_URL = 'https://github.com/soarstarter/electron-starter/blob/main/LICENSE'

/**
 * End-User License Agreement shown during first-run onboarding. Leave empty to
 * ship without a EULA gate (the default); set a URL to require acceptance.
 */
export const EULA_URL = ''

/**
 * Bump when the EULA text changes to force re-acceptance. Only meaningful when
 * {@link EULA_URL} is set. Stored acceptance is compared against this number.
 */
export const EULA_VERSION = 1
