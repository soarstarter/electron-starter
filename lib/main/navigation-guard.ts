const getOrigin = (url: string): string | null => {
  try {
    return new URL(url).origin
  } catch {
    return null
  }
}

export interface NavigationContext {
  loadedUrl: string | null
  devRendererUrl: string | undefined
  isPackaged: boolean
}

export const isAllowedInternalNavigation = (target: string, context: NavigationContext): boolean => {
  const targetOrigin = getOrigin(target)
  if (!targetOrigin) return false

  if (!context.isPackaged && context.devRendererUrl) {
    const devOrigin = getOrigin(context.devRendererUrl)
    if (devOrigin && devOrigin !== 'null' && devOrigin === targetOrigin) {
      return true
    }
  }

  if (!context.loadedUrl) return false

  const loadedOrigin = getOrigin(context.loadedUrl)
  if (!loadedOrigin || loadedOrigin === 'null') {
    return context.loadedUrl === target
  }

  return loadedOrigin === targetOrigin
}
