import path from 'node:path'
import { tmpdir } from 'node:os'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, realpath, rm, symlink, writeFile } from 'node:fs/promises'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { keepKnownRecentFiles, matchRecentFile } from './recent-file-access'

let root: string
let notes: string
let secret: string

beforeAll(async () => {
  // Deliberately not realpath'd: on macOS tmpdir() sits behind the /var ->
  // /private/var symlink, which exercises symlinked parent directories too.
  root = await mkdtemp(path.join(tmpdir(), 'recent-file-access-'))
  await mkdir(path.join(root, 'docs'))
  notes = path.join(root, 'docs', 'notes.txt')
  secret = path.join(root, 'secret.txt')
  await writeFile(notes, 'notes')
  await writeFile(secret, 'secret')
})

afterAll(async () => {
  await rm(root, { recursive: true, force: true })
})

describe('matchRecentFile', () => {
  it('allows an MRU entry and reads it through its canonical path', async () => {
    await expect(matchRecentFile(notes, [notes])).resolves.toEqual({
      status: 'allowed',
      entry: notes,
      realPath: await realpath(notes),
    })
  })

  it('denies any path that is not on the MRU list', async () => {
    await expect(matchRecentFile(secret, [notes])).resolves.toEqual({ status: 'denied' })
    await expect(matchRecentFile(secret, [])).resolves.toEqual({ status: 'denied' })
  })

  it('denies relative and empty paths', async () => {
    await expect(matchRecentFile('docs/notes.txt', [notes, 'docs/notes.txt'])).resolves.toEqual({ status: 'denied' })
    await expect(matchRecentFile('', [notes])).resolves.toEqual({ status: 'denied' })
  })

  describe('../ traversal', () => {
    it('denies a path that climbs out of an MRU directory to another file', async () => {
      const traversal = `${path.join(root, 'docs')}${path.sep}..${path.sep}secret.txt`
      await expect(matchRecentFile(traversal, [notes])).resolves.toEqual({ status: 'denied' })
    })

    it('denies a traversal that starts from an MRU file path', async () => {
      const traversal = `${notes}${path.sep}..${path.sep}..${path.sep}secret.txt`
      await expect(matchRecentFile(traversal, [notes])).resolves.toEqual({ status: 'denied' })
    })

    it('allows a non-canonical spelling of an MRU entry and reports the stored entry', async () => {
      const spelled = `${path.join(root, 'docs', 'missing-dir')}${path.sep}..${path.sep}.${path.sep}notes.txt`
      await expect(matchRecentFile(spelled, [notes])).resolves.toMatchObject({ status: 'allowed', entry: notes })
    })
  })

  describe('case differences', () => {
    const upper = () => path.join(root, 'docs', 'NOTES.TXT')

    it('matches a differently-cased path only when the filesystem says it is the same file', async () => {
      const caseInsensitive = existsSync(upper())
      const result = await matchRecentFile(upper(), [notes])

      if (caseInsensitive) {
        // macOS/Windows default volumes: same file, so the stored entry is opened.
        expect(result).toMatchObject({ status: 'allowed', entry: notes, realPath: await realpath(notes) })
      } else {
        // Case-sensitive volumes: NOTES.TXT is a different (here: missing) file.
        expect(result).toEqual({ status: 'denied' })
      }
    })

    it('never lets a differently-cased name reach a different file', async () => {
      if (existsSync(upper())) return // case-insensitive volume: there is no distinct file to reach
      await writeFile(upper(), 'other file')
      try {
        await expect(matchRecentFile(upper(), [notes])).resolves.toEqual({ status: 'denied' })
      } finally {
        await rm(upper())
      }
    })
  })

  describe('symlinks', () => {
    it('denies a symlink that points outside the MRU list', async () => {
      const link = path.join(root, 'docs', 'innocent.txt')
      await symlink(secret, link)
      try {
        await expect(matchRecentFile(link, [notes])).resolves.toEqual({ status: 'denied' })
      } finally {
        await rm(link)
      }
    })

    it('matches a symlinked MRU entry by where it points now', async () => {
      const link = path.join(root, 'docs', 'retarget.txt')
      await symlink(notes, link)
      try {
        // The link resolves to notes.txt, which is not itself on the list...
        await expect(matchRecentFile(notes, [link])).resolves.toMatchObject({ status: 'allowed', entry: link })
        // ...but a request is matched against where the entry points *now*.
        await rm(link)
        await symlink(secret, link)
        await expect(matchRecentFile(notes, [link])).resolves.toEqual({ status: 'denied' })
      } finally {
        await rm(link, { force: true })
      }
    })

    it('allows a symlink to an MRU file and reads the resolved target', async () => {
      const link = path.join(root, 'notes-link.txt')
      await symlink(notes, link)
      try {
        await expect(matchRecentFile(link, [notes])).resolves.toEqual({
          status: 'allowed',
          entry: notes,
          realPath: await realpath(notes),
        })
      } finally {
        await rm(link)
      }
    })
  })

  it('reports a deleted MRU entry as missing so it can be pruned', async () => {
    const gone = path.join(root, 'docs', 'gone.txt')
    await expect(matchRecentFile(gone, [notes, gone])).resolves.toEqual({ status: 'missing', entry: gone })
    await expect(matchRecentFile(path.join(root, 'never.txt'), [notes, gone])).resolves.toEqual({ status: 'denied' })
  })
})

describe('keepKnownRecentFiles', () => {
  const current = ['/docs/a.txt', '/docs/b.txt', '/docs/c.txt']

  it('lets the renderer clear, prune and reorder the list', () => {
    expect(keepKnownRecentFiles([], current)).toEqual([])
    expect(keepKnownRecentFiles(['/docs/c.txt', '/docs/a.txt'], current)).toEqual(['/docs/c.txt', '/docs/a.txt'])
  })

  it('drops paths that are not already on the list', () => {
    expect(keepKnownRecentFiles(['/etc/hosts', '/docs/b.txt', '/docs/../etc/hosts'], current)).toEqual(['/docs/b.txt'])
    expect(keepKnownRecentFiles(['/docs/A.txt'], current)).toEqual([])
  })
})
