// [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
import type { ComponentType } from 'react'
import {
  AvatarPreview,
  BadgePreview,
  ButtonPreview,
  CommandPreview,
  DialogPreview,
  DropdownMenuPreview,
  FeedbackStatesPreview,
  FormPreview,
  InputPreview,
  OfflineBannerPreview,
  RouteFallbackPreview,
  ScrollAreaPreview,
  SectionShellPreview,
  SelectPreview,
  SonnerPreview,
  SwitchPreview,
  TabsPreview,
} from './component-previews'

export type ComponentGroup = 'controls' | 'inputs' | 'overlays' | 'feedback' | 'layout'

export interface ComponentEntry {
  id: string
  title: string
  summary: string
  group: ComponentGroup
  importPath: string
  render: ComponentType
}

export const COMPONENT_GROUPS: readonly ComponentGroup[] = ['controls', 'inputs', 'overlays', 'feedback', 'layout']

export const COMPONENT_CATALOG: readonly ComponentEntry[] = [
  {
    id: 'button',
    title: 'Button',
    summary: 'Primary command surface with variants, icon sizes, disabled state, and loading affordances.',
    group: 'controls',
    importPath: '@/app/components/ui/button',
    render: ButtonPreview,
  },
  {
    id: 'badge',
    title: 'Badge',
    summary: 'Compact metadata labels for statuses, counts, and secondary annotations.',
    group: 'feedback',
    importPath: '@/app/components/ui/badge',
    render: BadgePreview,
  },
  {
    id: 'input',
    title: 'Input',
    summary: 'Single-line text input with placeholder, disabled, focus, and invalid states.',
    group: 'inputs',
    importPath: '@/app/components/ui/input',
    render: InputPreview,
  },
  {
    id: 'select',
    title: 'Select',
    summary: 'Radix select wrapper for bounded option sets and settings pickers.',
    group: 'inputs',
    importPath: '@/app/components/ui/select',
    render: SelectPreview,
  },
  {
    id: 'switch',
    title: 'Switch',
    summary: 'Binary toggle control used throughout settings surfaces.',
    group: 'inputs',
    importPath: '@/app/components/ui/switch',
    render: SwitchPreview,
  },
  {
    id: 'tabs',
    title: 'Tabs',
    summary: 'Segmented page sections with active, disabled, and content panel states.',
    group: 'layout',
    importPath: '@/app/components/ui/tabs',
    render: TabsPreview,
  },
  {
    id: 'dialog',
    title: 'Dialog',
    summary: 'Accessible modal layer with trigger, title, description, footer, and close behavior.',
    group: 'overlays',
    importPath: '@/app/components/ui/dialog',
    render: DialogPreview,
  },
  {
    id: 'dropdown-menu',
    title: 'Dropdown menu',
    summary: 'Contextual menu with labels, shortcuts, checkbox items, separators, and destructive actions.',
    group: 'overlays',
    importPath: '@/app/components/ui/dropdown-menu',
    render: DropdownMenuPreview,
  },
  {
    id: 'form-zod',
    title: 'Form + Zod',
    summary: 'React Hook Form wiring with labels, descriptions, messages, and schema validation.',
    group: 'inputs',
    importPath: '@/app/components/ui/form',
    render: FormPreview,
  },
  {
    id: 'avatar',
    title: 'Avatar',
    summary: 'Profile image surface with initials and icon fallback behavior.',
    group: 'feedback',
    importPath: '@/app/components/ui/avatar',
    render: AvatarPreview,
  },
  {
    id: 'scroll-area',
    title: 'Scroll area',
    summary: 'Contained scrolling region with styled Radix scrollbars.',
    group: 'layout',
    importPath: '@/app/components/ui/scroll-area',
    render: ScrollAreaPreview,
  },
  {
    id: 'sonner',
    title: 'Sonner toasts',
    summary: 'Global toast helper for success, error, and action feedback.',
    group: 'feedback',
    importPath: '@/app/components/ui/sonner',
    render: SonnerPreview,
  },
  {
    id: 'command',
    title: 'Command',
    summary: 'Composable command list primitives used by the app command palette.',
    group: 'overlays',
    importPath: '@/app/components/ui/command',
    render: CommandPreview,
  },
  {
    id: 'offline-banner',
    title: 'OfflineBanner',
    summary: 'Shell banner that appears only while the OS reports no network.',
    group: 'feedback',
    importPath: '@/app/components/layout/OfflineBanner',
    render: OfflineBannerPreview,
  },
  {
    id: 'section-shell',
    title: 'SectionShell',
    summary: 'Settings section composition with consistent headings and rows.',
    group: 'layout',
    importPath: '@/app/routes/settings/sections/SectionShell',
    render: SectionShellPreview,
  },
  {
    id: 'route-fallback',
    title: 'RouteFallback',
    summary: 'Suspense loading state for lazy route chunks.',
    group: 'feedback',
    importPath: '@/app/components/layout/RouteFallback',
    render: RouteFallbackPreview,
  },
  {
    id: 'feedback-states',
    title: 'Feedback states',
    summary: 'Common loading, success, and compact icon-only action patterns used across surfaces.',
    group: 'feedback',
    importPath: '@/app/components/ui/button',
    render: FeedbackStatesPreview,
  },
]

export const componentsIn = (group: ComponentGroup): readonly ComponentEntry[] =>
  COMPONENT_CATALOG.filter((entry) => entry.group === group)
