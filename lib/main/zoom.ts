import type { BrowserWindow } from 'electron'
import { clampZoomLevel, type SettingsStore } from './settings'

type ZoomSettingsStore = Pick<SettingsStore, 'update'>

export const setWindowZoomLevel = (
  window: BrowserWindow,
  settingsStore: ZoomSettingsStore,
  zoomLevel: number
): number => {
  const nextZoomLevel = clampZoomLevel(zoomLevel)
  window.webContents.setZoomLevel(nextZoomLevel)
  settingsStore.update({ zoomLevel: nextZoomLevel })
  return nextZoomLevel
}

export const adjustWindowZoomLevel = (
  window: BrowserWindow,
  settingsStore: ZoomSettingsStore,
  delta: number
): number => {
  return setWindowZoomLevel(window, settingsStore, window.webContents.zoomLevel + delta)
}
