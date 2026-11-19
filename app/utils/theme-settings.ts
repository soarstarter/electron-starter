import type { ChannelReturn } from '@/lib/conveyor/schemas'

export type ThemePreference = ChannelReturn<'get-settings'>['theme']
export type AccentPreference = ChannelReturn<'get-settings'>['accentColor']

const prefersDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches

export const isDarkTheme = (theme: ThemePreference): boolean => {
  if (theme === 'system') return prefersDark()
  return theme === 'dark'
}

export const applyThemePreference = (theme: ThemePreference): void => {
  const isDark = isDarkTheme(theme)
  document.documentElement.classList.toggle('dark', isDark)
  window.conveyor.window.windowSetTitlebarDark(isDark).catch((error) => {
    console.error('Failed to sync titlebar theme:', error)
  })
}

export const loadThemePreference = async (): Promise<ThemePreference> => {
  const settings = await window.conveyor.app.getSettings()
  applyThemePreference(settings.theme)
  return settings.theme
}

export const setThemePreference = async (theme: ThemePreference): Promise<ThemePreference> => {
  const settings = await window.conveyor.app.setSettings({ theme })
  applyThemePreference(settings.theme)
  return settings.theme
}

export const toggleThemePreference = async (): Promise<ThemePreference> => {
  const current = await loadThemePreference()
  const next: ThemePreference = current === 'dark' ? 'light' : 'dark'
  return setThemePreference(next)
}

export const applyAccentPreference = (accent: AccentPreference): void => {
  // `default` removes the attribute so the brand primary from :root applies.
  if (accent === 'default') {
    delete document.documentElement.dataset.accent
  } else {
    document.documentElement.dataset.accent = accent
  }
}

export const loadAccentPreference = async (): Promise<AccentPreference> => {
  const settings = await window.conveyor.app.getSettings()
  applyAccentPreference(settings.accentColor)
  return settings.accentColor
}

export const setAccentPreference = async (accent: AccentPreference): Promise<AccentPreference> => {
  const settings = await window.conveyor.app.setSettings({ accentColor: accent })
  applyAccentPreference(settings.accentColor)
  return settings.accentColor
}
