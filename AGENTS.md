# Repository Guidelines

## Scope

- This is Electron Starter, the open-source, fully local edition of SoarStarter's Electron template. It needs no backend
  and the app makes no network requests at runtime.
- Do not add features that need a backend service (accounts, payments, cloud sync, telemetry, update feeds) or a release
  pipeline (signing, notarization). Those belong to the commercial edition; the Showcase only lists them through
  `app/showcase/pro-catalog.ts`.
- Keep the renderer CSP in `app/index.html` closed to external origins.
- `pnpm check:lite` enforces these boundaries from `lite-manifest.json` (forbidden paths, words, dependencies, CSP, and a
  gitleaks secret scan). It runs in CI and as a pre-push hook; keep it passing.

## Project Structure & Module Organization

- `app/`: Renderer process (React + TypeScript). UI components, hooks, styles, and entry files like `app/app.tsx` and `app/renderer.tsx`.
- `app/showcase/`: Template capability catalog and types. Demo-only; marked with `[template-demo]`.
- `app/routes/showcase/`: Showcase pages, Components gallery, and live demos. Demo-only; safe to delete after following `docs/CUSTOMIZE.md`.
- `lib/main/`: Electron main process (window lifecycle, protocols, app bootstrapping).
- `lib/preload/`: Preload bridge exposed to renderer with context isolation.
- `lib/conveyor/`: Typed IPC layer (`api/`, `handlers/`, `schemas/`).
- `resources/`: Build assets (icons, mac entitlements).
- `shared/`: Code used by every process, including brand constants (`shared/constants.ts`) and config flags (`shared/config.ts`).
- Config lives at repo root: `electron.vite.config.ts`, `electron-builder.yml`, `eslint.config.mjs`, `.prettierrc`, `tsconfig*.json`.

## Build, Test, and Development Commands

- `pnpm dev`: Start Electron + Vite in watch mode for local development.
- `pnpm start`: Preview built app locally.
- `pnpm lint` / `pnpm lint:check`: Run ESLint with or without auto-fix.
- `pnpm typecheck`: Type-check the main, preload, and renderer projects.
- `pnpm format` / `pnpm format:check`: Apply or check Prettier formatting.
- `pnpm build:win` / `pnpm build:mac` / `pnpm build:linux`: Build unsigned installers per platform.
- `pnpm build:unpack`: Build app without creating installer packages.

## Coding Style & Naming Conventions

- Language: TypeScript for both renderer and Electron process code.
- Formatting (Prettier): 2-space indentation, single quotes, no semicolons, 120-char line width.
- Linting: ESLint + `typescript-eslint` + React/React Hooks plugins.
- Naming patterns:
  - React components: `PascalCase` (for example `AppHeader.tsx`).
  - Hooks: `kebab-case` filename with `use-` prefix (for example `use-conveyor.ts`).
  - Utility and process modules: descriptive `kebab-case` filenames.

## Testing Guidelines

- Unit tests run with Vitest via `pnpm test` (core suite) and `pnpm test:unit` (all tests, as in CI).
- Minimum quality gate for changes: run `pnpm check:lite`, `pnpm format:check`, `pnpm lint:check`, `pnpm typecheck`, and `pnpm test:unit`.
- For UI or IPC changes, manually verify in `pnpm dev` (window actions, renderer state, and Conveyor API calls).
- If adding tests, prefer colocated `*.test.ts` or `*.test.tsx` near the feature.

## Template Showcase Deletion

- The template Showcase is enabled by default with `VITE_SHOWCASE_ENABLED=true` and `MAIN_VITE_SHOWCASE_ENABLED=true`.
- Set both flags to `false` to preview the app without demo surfaces before deleting files.
- Files and core touchpoints marked `[template-demo]` are part of the removable demo layer; follow `docs/CUSTOMIZE.md` before deleting `app/showcase/` or `app/routes/showcase/`.

## Commit & Pull Request Guidelines

- Follow Conventional Commit style seen in history: `fix: ...`, `chore: ...`, `refactor: ...`.
- Keep commits scoped and atomic; avoid mixing refactors with behavior changes.
- PRs should include:
  - Clear summary of user-visible and technical changes.
  - Linked issue/task when applicable.
  - Validation steps run (the quality gate above, manual checks).
  - Screenshots or short recordings for UI changes.
