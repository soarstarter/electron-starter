// Centralized env-read hub (Tier 3 step 12). All renderer-facing configuration
// is read here once so buyers have a single place to toggle whole subsystems and
// so the rest of the app never touches `import.meta.env` directly.
//
// Reads `import.meta.env` (Vite) when available so the renderer picks up `VITE_*`
// values; falls back to an empty env in any non-Vite context (main process, bare
// Node, unit tests) where these flags are not relevant.

type EnvRecord = Record<string, unknown> | undefined

const viteEnv: EnvRecord = (() => {
  try {
    return import.meta.env as unknown as Record<string, unknown>
  } catch {
    return undefined
  }
})()

/**
 * Coerce a Vite env value to a boolean. Accepts `true`/`"true"`/`"1"` as on and
 * `false`/`"false"`/`"0"` as off; anything unset (or unrecognized) resolves to
 * `fallback`. Pure and `env`-injected so the branch matrix is unit-testable.
 */
export const readFlag = (env: EnvRecord, name: string, fallback: boolean): boolean => {
  const raw = env?.[name]
  if (raw === true || raw === 'true' || raw === '1') return true
  if (raw === false || raw === 'false' || raw === '0') return false
  return fallback
}

/**
 * Read a non-empty string env value, or `''` when unset/blank/non-string. Pure
 * and `env`-injected so it stays unit-testable alongside {@link readFlag}.
 */
export const readString = (env: EnvRecord, name: string): string => {
  const raw = env?.[name]
  return typeof raw === 'string' && raw.trim() !== '' ? raw : ''
}

/**
 * Module feature flags so a buyer can strip whole subsystems from a build via
 * `.env`. `showcase` defaults ON.
 */
export const features = {
  /** [template-demo] Template showcase and demo catalog surfaces. Keep MAIN_VITE_SHOWCASE_ENABLED matched. */
  showcase: readFlag(viteEnv, 'VITE_SHOWCASE_ENABLED', true),
} as const

/**
 * [template-demo]
 * Showcase-specific config. `enabled` mirrors {@link features.showcase}; kept
 * as a dedicated export so template/demo UI can disappear behind one switch.
 */
export const showcaseConfig = {
  /** Master switch for the template showcase catalog and demo surfaces. */
  enabled: features.showcase,
} as const
