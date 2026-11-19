import { describe, expect, it } from 'vitest'
import { getMainLanguage, initMainI18n, setMainLanguage, t } from './i18n'

describe('main-process i18n', () => {
  it('initializes with the requested language and translates menu keys', () => {
    initMainI18n('en')
    expect(t('common:menu.file')).toBe('File')
    expect(t('common:tray.openMainWindow')).toBe('Open Main Window')
    expect(getMainLanguage()).toBe('en')
  })

  it('switches language and updates translated output', async () => {
    initMainI18n('en')
    await setMainLanguage('zh')
    expect(getMainLanguage()).toBe('zh')
    expect(t('common:menu.file')).toBe('文件')
    expect(t('common:tray.openMainWindow')).toBe('打开主窗口')
    await setMainLanguage('en')
  })
})
