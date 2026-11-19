import { describe, expect, it } from 'vitest'
import { redactContext, redactSensitive } from './log-redact'

describe('redactContext', () => {
  it('returns undefined when no context is provided', () => {
    expect(redactContext(undefined)).toBeUndefined()
  })

  it('preserves non-sensitive fields', () => {
    expect(redactContext({ route: '/settings', count: 3, ok: true })).toEqual({
      route: '/settings',
      count: 3,
      ok: true,
    })
  })

  it.each([
    'password',
    'userPassword',
    'token',
    'accessToken',
    'apiKey',
    'api_key',
    'secret',
    'authHeader',
    'sessionId',
    'cookieJar',
    'credentialId',
    'PIN',
  ])('redacts values keyed by sensitive name %s', (key) => {
    expect(redactContext({ [key]: 'super-secret-value' })).toEqual({ [key]: '[redacted]' })
  })

  it('redacts only the sensitive entries while leaving others intact', () => {
    expect(redactContext({ route: '/file', token: 'abc.def.ghi' })).toEqual({
      route: '/file',
      token: '[redacted]',
    })
  })

  it('redacts credential-shaped string values and error stacks', () => {
    const redacted = redactSensitive({
      reason: new Error('Request rejected: token=abc.def.ghi Authorization: Bearer header.value'),
      url: 'https://user:pass@example.com/files',
    })

    expect(redacted.reason.message).not.toContain('abc.def.ghi')
    expect(redacted.reason.message).not.toContain('header.value')
    expect(redacted.url).toBe('https://[redacted]@example.com/files')
  })

  it('redacts desktop OAuth codes, state, and PKCE values in URLs', () => {
    const redacted = redactSensitive({
      callback: 'electron-starter://auth/callback?code=secret-code&state=secret-state',
      start: 'https://api.example.com/api/desktop-auth/start?provider=github&code_challenge=abc&state=xyz',
      codeVerifier: 'raw-verifier',
    })

    expect(redacted.callback).toBe('electron-starter://auth/callback?code=[redacted]&state=[redacted]')
    expect(redacted.start).toContain('provider=github')
    expect(redacted.start).not.toContain('abc')
    expect(redacted.start).not.toContain('xyz')
    expect(redacted.codeVerifier).toBe('[redacted]')
  })
})
