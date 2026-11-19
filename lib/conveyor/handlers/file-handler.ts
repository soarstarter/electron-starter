import path from 'node:path'
import { app, dialog } from 'electron'
import { readFile, stat, writeFile } from 'node:fs/promises'
import { getRequestingWindow, handle } from '@/lib/main/shared'
import type { WindowStateStore } from '@/lib/main/window-state'
import type { SettingsStore } from '@/lib/main/settings'
import type { ImageMimeType } from '@/lib/conveyor/schemas/file-schema'

const IMAGE_EXTENSION_FILTERS: Record<ImageMimeType, readonly string[]> = {
  'image/png': ['png'],
  'image/jpeg': ['jpg', 'jpeg'],
  'image/webp': ['webp'],
}

const IMAGE_EXTENSION_TO_MIME: Record<string, ImageMimeType> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
}

export const registerFileHandlers = (windowStateStore: WindowStateStore, settingsStore: SettingsStore) => {
  // Record an opened/saved document as the last path (for restore) and push it
  // onto the MRU list that backs the Files page and the OS recents menu.
  const rememberFile = (filePath: string) => {
    windowStateStore.setLastOpenedPath(filePath)
    settingsStore.addRecentFile(filePath)
    try {
      // macOS / Windows only; a no-op-and-throw on Linux, so guard it.
      app.addRecentDocument(filePath)
    } catch {
      // Ignore: the in-app recents list is the source of truth regardless.
    }
  }

  handle('file-open', async (event) => {
    const window = getRequestingWindow(event)
    const selected = await dialog.showOpenDialog(window, {
      title: 'Open File',
      properties: ['openFile'],
    })

    if (selected.canceled || selected.filePaths.length === 0) {
      return { canceled: true, path: null, content: null }
    }

    const path = selected.filePaths[0]
    const content = await readFile(path, 'utf-8')
    rememberFile(path)

    return { canceled: false, path, content }
  })

  handle('file-open-last', async () => {
    const lastPath = windowStateStore.getLastOpenedPath()
    if (!lastPath) {
      return { canceled: true, path: null, content: null }
    }

    try {
      const content = await readFile(lastPath, 'utf-8')
      return { canceled: false, path: lastPath, content }
    } catch (error) {
      console.error('Failed to restore last opened file:', error)
      return { canceled: true, path: null, content: null }
    }
  })

  handle('file-open-path', async (_event, requestedPath) => {
    try {
      const content = await readFile(requestedPath, 'utf-8')
      rememberFile(requestedPath)
      return { canceled: false, path: requestedPath, content }
    } catch (error) {
      // The file may have been moved or deleted since it was added to the MRU
      // list; drop it so the stale entry doesn't linger.
      console.error('Failed to open recent file:', error)
      settingsStore.removeRecentFile(requestedPath)
      return { canceled: true, path: null, content: null }
    }
  })

  handle('file-save', async (event, { content, saveAs }) => {
    let targetPath = windowStateStore.getLastOpenedPath()

    if (saveAs || !targetPath) {
      const window = getRequestingWindow(event)
      const selected = await dialog.showSaveDialog(window, { title: 'Save File' })

      if (selected.canceled || !selected.filePath) {
        return { canceled: true, path: null }
      }

      targetPath = selected.filePath
    }

    await writeFile(targetPath, content, 'utf-8')
    rememberFile(targetPath)

    return { canceled: false, path: targetPath }
  })

  handle('file-open-image', async (event, { accept, maxBytes }) => {
    const window = getRequestingWindow(event)
    const allowedExtensions = Array.from(new Set(accept.flatMap((mime) => IMAGE_EXTENSION_FILTERS[mime])))

    const selected = await dialog.showOpenDialog(window, {
      title: 'Choose Image',
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: [...allowedExtensions] }],
    })

    if (selected.canceled || selected.filePaths.length === 0) {
      return { canceled: true }
    }

    const filePath = selected.filePaths[0]
    const ext = path.extname(filePath).slice(1).toLowerCase()
    const mimeType = IMAGE_EXTENSION_TO_MIME[ext]
    if (!mimeType || !accept.includes(mimeType)) {
      const allowed = accept.join(', ')
      throw new Error(`Unsupported image type: ${ext || 'unknown'} (allowed: ${allowed})`)
    }

    const stats = await stat(filePath)
    if (stats.size > maxBytes) {
      throw new Error(`Image is too large: ${stats.size} bytes (max ${maxBytes})`)
    }

    const buffer = await readFile(filePath)
    const bytes = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    return {
      canceled: false,
      path: filePath,
      name: path.basename(filePath),
      bytes,
      mimeType,
    }
  })
}
