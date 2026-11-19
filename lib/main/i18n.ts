import i18next, { type i18n as I18nInstance } from 'i18next'
import {
  DEFAULT_LANGUAGE,
  DEFAULT_NAMESPACE,
  I18N_NAMESPACES,
  SUPPORTED_LANGUAGES,
  resolveSupportedLanguage,
  resources,
  type SupportedLanguage,
} from '@/app/lib/i18n/resources'

const i18n: I18nInstance = i18next.createInstance()
let initialized = false

export const initMainI18n = (language: SupportedLanguage = DEFAULT_LANGUAGE): I18nInstance => {
  if (initialized) {
    if (i18n.language !== language) {
      void i18n.changeLanguage(language)
    }
    return i18n
  }

  void i18n.init({
    resources,
    lng: language,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    ns: I18N_NAMESPACES as unknown as string[],
    defaultNS: DEFAULT_NAMESPACE,
    interpolation: { escapeValue: false },
    initAsync: false,
    returnNull: false,
  })

  initialized = true
  return i18n
}

export const setMainLanguage = async (language: SupportedLanguage): Promise<void> => {
  if (!initialized) initMainI18n(language)
  else await i18n.changeLanguage(language)
}

export const getMainLanguage = (): SupportedLanguage => resolveSupportedLanguage(i18n.language)

export const t = (key: string, options?: Record<string, unknown>): string => {
  if (!initialized) initMainI18n()
  return i18n.t(key, options) as string
}

export { i18n as mainI18n }
