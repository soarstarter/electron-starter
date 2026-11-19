import { readFlag } from '@/shared/config'

// [template-demo] Main-process flags intentionally read `MAIN_VITE_*`; keep matching renderer
// `VITE_*` values in sync so native and renderer surfaces hide together.
export const mainFeatures = {
  showcase: readFlag(process.env, 'MAIN_VITE_SHOWCASE_ENABLED', readFlag(process.env, 'VITE_SHOWCASE_ENABLED', true)),
} as const
