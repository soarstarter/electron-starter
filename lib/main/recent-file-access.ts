import path from 'node:path'
import { realpath } from 'node:fs/promises'

export type RecentFileMatch =
  /** The request names an MRU file; read `realPath`, report and remember `entry`. */
  | { status: 'allowed'; entry: string; realPath: string }
  /** The request names an MRU entry whose file no longer exists. */
  | { status: 'missing'; entry: string }
  /** The request does not name any file on the MRU list. */
  | { status: 'denied' }

type Realpath = (target: string) => Promise<string>

const tryRealpath = async (target: string, resolveReal: Realpath): Promise<string | null> => {
  try {
    return await resolveReal(target)
  } catch {
    return null
  }
}

/**
 * Decides whether a renderer-supplied path may be opened as a recent file.
 *
 * Both the request and every MRU entry are canonicalized before comparing:
 * `path.resolve` removes `.`/`..` segments, and the native `realpath` resolves
 * symlinks and, on case-insensitive volumes (macOS, Windows), returns the
 * on-disk casing. A request is allowed only when it resolves to the same file
 * as an MRU entry, so `../` traversal, a differently-cased name for another
 * file, or a symlink pointing outside the list are all denied.
 */
export const matchRecentFile = async (
  requested: string,
  recentFiles: readonly string[],
  resolveReal: Realpath = realpath
): Promise<RecentFileMatch> => {
  if (!requested || !path.isAbsolute(requested)) return { status: 'denied' }

  const requestedPath = path.resolve(requested)
  const requestedReal = await tryRealpath(requestedPath, resolveReal)

  for (const entry of recentFiles) {
    if (!path.isAbsolute(entry)) continue
    const entryPath = path.resolve(entry)

    if (requestedReal === null) {
      // The request no longer resolves; it may still name a stale MRU entry.
      if (entryPath === requestedPath) return { status: 'missing', entry }
      continue
    }

    if ((await tryRealpath(entryPath, resolveReal)) === requestedReal) {
      return { status: 'allowed', entry, realPath: requestedReal }
    }
  }

  return { status: 'denied' }
}

/**
 * Narrows a renderer-supplied `recentFiles` value to entries that are already
 * on the list, preserving the requested order. The renderer may clear, prune
 * or reorder the MRU list, but only the main process adds to it (after the
 * user opens or saves a file); otherwise `set-settings` could plant any path
 * and `file-open-path` would then read it.
 */
export const keepKnownRecentFiles = (requested: readonly string[], current: readonly string[]): string[] => {
  const known = new Set(current)
  return requested.filter((entry) => known.has(entry))
}
