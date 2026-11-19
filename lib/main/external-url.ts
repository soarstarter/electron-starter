import { shell } from 'electron'

const ALLOWED_EXTERNAL_PROTOCOLS = new Set(['https:', 'mailto:'])

export const getAllowedExternalUrl = (rawUrl: string): string => {
  let url: URL

  try {
    url = new URL(rawUrl)
  } catch {
    throw new Error('External URL must be an absolute URL')
  }

  if (!ALLOWED_EXTERNAL_PROTOCOLS.has(url.protocol)) {
    throw new Error(`External URL protocol is not allowed: ${url.protocol}`)
  }

  return url.toString()
}

export const openExternal = async (rawUrl: string): Promise<void> => {
  await shell.openExternal(getAllowedExternalUrl(rawUrl))
}
