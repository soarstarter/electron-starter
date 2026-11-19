// [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Languages, Palette } from 'lucide-react'
import { ACCENT_COLORS } from '@/lib/conveyor/schemas/app-schema'
import { Button } from '@/app/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { useConveyor } from '@/app/hooks/use-conveyor'
import { changeLanguage, resolveSupportedLanguage, SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/app/lib/i18n'
import {
  setAccentPreference,
  setThemePreference,
  type AccentPreference,
  type ThemePreference,
} from '@/app/utils/theme-settings'
import { cn } from '@/lib/utils'
import type { ChannelReturn } from '@/lib/conveyor/schemas'

type AppSettings = ChannelReturn<'get-settings'>

const THEMES: ThemePreference[] = ['light', 'dark', 'system']
const LANGUAGES: Array<'system' | SupportedLanguage> = ['system', ...SUPPORTED_LANGUAGES]
const ACCENT_SWATCHES: Record<AccentPreference, string> = {
  default: '#3b76f6',
  blue: '#3b76f6',
  violet: 'hsl(262 83% 58%)',
  green: 'hsl(142 71% 45%)',
  rose: 'hsl(347 77% 50%)',
  amber: 'hsl(38 92% 50%)',
}

export const ThemeI18nDemo = () => {
  const { t } = useTranslation('settings')
  const app = useConveyor('app')
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [status, setStatus] = useState('Ready.')

  useEffect(() => {
    app
      .getSettings()
      .then(setSettings)
      .catch((error) => console.error('Failed to load appearance settings:', error))
  }, [app])

  const updateTheme = async (theme: ThemePreference) => {
    await setThemePreference(theme)
    setSettings(await app.setSettings({ theme }))
    setStatus(`Theme set to ${theme}.`)
  }

  const updateAccent = async (accentColor: AccentPreference) => {
    await setAccentPreference(accentColor)
    setSettings(await app.setSettings({ accentColor }))
    setStatus(`Accent set to ${accentColor}.`)
  }

  const updateLocale = async (locale: 'system' | SupportedLanguage) => {
    const next = await app.setSettings({ locale })
    const effective = locale === 'system' ? resolveSupportedLanguage(await app.getLocale()) : locale
    await changeLanguage(effective)
    await app.setLocale(effective)
    setSettings(next)
    setStatus(`Language set to ${effective}.`)
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <section className="rounded-lg border border-border bg-card p-4">
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-md bg-muted p-2 text-muted-foreground">
            <Palette className="size-4" aria-hidden />
          </div>
          <div>
            <h2 className="text-base font-semibold">Theme and accent</h2>
            <p className="text-sm text-muted-foreground">{status}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {THEMES.map((theme) => (
              <Button
                key={theme}
                size="sm"
                variant={settings?.theme === theme ? 'default' : 'outline'}
                onClick={() => void updateTheme(theme)}
                disabled={!settings}
              >
                {t(`appearance.theme.${theme}`)}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {ACCENT_COLORS.map((accent) => {
              const selected = settings?.accentColor === accent
              return (
                <button
                  key={accent}
                  type="button"
                  onClick={() => void updateAccent(accent)}
                  disabled={!settings}
                  title={t(`appearance.accent.options.${accent}`)}
                  aria-label={t(`appearance.accent.options.${accent}`)}
                  aria-pressed={selected}
                  style={{ backgroundColor: ACCENT_SWATCHES[accent] }}
                  className={cn(
                    'flex size-7 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition disabled:opacity-50',
                    selected ? 'ring-2 ring-ring' : 'ring-1 ring-border hover:ring-ring/50'
                  )}
                >
                  {selected && <Check className="size-4 text-white" aria-hidden />}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-md bg-muted p-2 text-muted-foreground">
            <Languages className="size-4" aria-hidden />
          </div>
          <div>
            <h2 className="text-base font-semibold">Runtime language</h2>
            <p className="text-sm text-muted-foreground">Change the active i18n language without restarting.</p>
          </div>
        </div>
        <Select value={settings?.locale ?? 'system'} onValueChange={(value) => void updateLocale(value as never)}>
          <SelectTrigger className="w-52" aria-label={t('general.language.label')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((language) => (
              <SelectItem key={language} value={language}>
                {t(`general.language.${language}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>
    </div>
  )
}
