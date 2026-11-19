# Contributing

Thanks for helping improve Electron Starter.

## How this repository is maintained

Electron Starter is the open-source edition of SoarStarter's Electron template. New features are built in the
commercial edition first and then synced here, so this repository mostly receives those syncs plus community fixes.
Pull requests that are merged here are also ported back, so the two editions stay in step.

That makes some contributions a better fit than others:

- **Welcome:** bug fixes, documentation fixes, accessibility and platform-compatibility fixes, test coverage, and small
  improvements to existing features.
- **Please open an issue first:** new features, new dependencies, or changes to the IPC contracts, settings schema, or
  folder layout. A short discussion avoids work that cannot be merged.
- **Out of scope:** features that need a backend service (accounts, payments, cloud sync, telemetry) or a release
  pipeline (signing, update feeds). This edition is intentionally fully local.

## Development setup

Requires Node.js `^20.19.0 || >=22.12.0` and pnpm 11.

```bash
pnpm install
pnpm dev
```

## Before you open a pull request

Run the same checks as CI:

```bash
pnpm check:lite
pnpm format:check
pnpm lint:check
pnpm typecheck
pnpm test:unit
```

`pnpm check:lite` keeps this repository free of commercial-edition code. It needs
[gitleaks](https://github.com/gitleaks/gitleaks) for its secret scan; without it, run
`pnpm check:lite --skip-secrets` locally and let CI run the full check. The same check runs as a pre-push hook, which
`pnpm install` enables.

For UI or IPC changes, also check the behavior in `pnpm dev` and include a screenshot or short recording in the pull
request.

## Conventions

- TypeScript everywhere; Prettier formatting (2 spaces, single quotes, no semicolons, 120 columns).
- Components use `PascalCase.tsx`; hooks use `use-kebab-case.ts`; other modules use `kebab-case.ts`.
- New IPC channels need a Zod schema in `lib/conveyor/schemas/` and a test.
- Put tests next to the code they cover as `*.test.ts` or `*.test.tsx`.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org) (`fix: …`, `feat: …`, `docs: …`).

By contributing, you agree that your contribution is licensed under the [MIT License](LICENSE).
