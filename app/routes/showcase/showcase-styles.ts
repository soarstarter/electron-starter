// [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
import type { CapabilityStatus } from '@/app/showcase/capability-types'

export const STATUS_TINTS: Record<CapabilityStatus, string> = {
  live: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  'packaged-only': 'border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  'os-specific': 'border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300',
}
