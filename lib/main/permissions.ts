import { session, type Session } from 'electron'

type PermissionCheckHandler = Exclude<Parameters<Session['setPermissionCheckHandler']>[0], null>
type PermissionRequestHandler = Exclude<Parameters<Session['setPermissionRequestHandler']>[0], null>
type PermissionCheck = Parameters<PermissionCheckHandler>[1]
type PermissionRequest = Parameters<PermissionRequestHandler>[1]
type RendererPermission = PermissionCheck | PermissionRequest

// Renderer permissions are denied by default. Add permission names here only
// when a renderer-owned feature genuinely needs the browser permission API.
export const ALLOWED_RENDERER_PERMISSIONS = [] as const satisfies readonly RendererPermission[]

export const isRendererPermissionAllowed = (permission: RendererPermission | string): boolean => {
  return (ALLOWED_RENDERER_PERMISSIONS as readonly string[]).includes(permission)
}

export const registerPermissionHandlers = (targetSession: Session = session.defaultSession): void => {
  targetSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(isRendererPermissionAllowed(permission))
  })

  targetSession.setPermissionCheckHandler((_webContents, permission) => isRendererPermissionAllowed(permission))
}
