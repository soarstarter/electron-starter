# Changelog

All notable changes to Electron Starter are listed here. This project follows
[Conventional Commits](https://www.conventionalcommits.org); see `git log` for
the full history.

Electron Starter started from
[electron-react-app](https://github.com/guasam/electron-react-app) v12.1.0. Its
release history before that point lives in that repository's `CHANGELOG.md`
(see [`CREDITS.md`](CREDITS.md)).

## 1.0.0 — Unreleased

First open-source release.

- Desktop platform: single-instance app intents, `electron-starter://` deep
  links, system tray, native menu, native notifications, shortcut registry,
  window state and zoom persistence, file dialogs with recent files.
- Type-safe IPC: Conveyor channels declared as Zod schemas and validated in the
  main process; Electron upgraded to v45 with the async `safeStorage` API.
- Security: sandboxed renderer, navigation guard, external-URL policy,
  deny-by-default permissions, a CSP with no external origins, log redaction,
  and secure storage.
- App shell: settings center with search, command palette, first-run
  onboarding with an optional EULA, accent theming, i18n (en/zh), About, Logs,
  Help, and Error pages, and an offline banner.
- Data on the device: versioned settings store with migrations, and settings
  backup export and import.
- Showcase: capability catalog with live demos and a components gallery, all
  removable via `docs/CUSTOMIZE.md`.
- Removed the upstream Welcome Kit and custom titlebar menu.
