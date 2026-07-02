# Contributing to Yozora

Thanks for your interest in contributing! This guide covers the local setup and the common
workflows.

## Prerequisites

- **Node.js** >= 20
- **pnpm** — the repo pins a version via the `packageManager` field; run `corepack enable` to pick
  it up automatically.

## Setup

```bash
pnpm install
```

This installs all workspace dependencies and sets up the Husky git hooks.

## Common commands

| Command              | Description                                          |
| :------------------- | :--------------------------------------------------- |
| `pnpm build`         | Build all packages (rollup, dual ESM/CJS + `.d.ts`)  |
| `pnpm test`          | Run the test suites (vitest)                         |
| `pnpm test:coverage` | Run tests with coverage                              |
| `pnpm lint`          | Lint with ESLint                                     |
| `pnpm typecheck`     | Type-check with `tsc --noEmit`                       |
| `pnpm spellcheck`    | Spell-check sources with cspell                      |
| `pnpm format`        | Auto-fix lint + format with Prettier                 |
| `pnpm doc`           | Regenerate package READMEs from handlebars templates |

CI runs `lint`, `typecheck`, `format:check`, and `spellcheck` (the `check` job), plus `build` +
`test:coverage` across Node 20/22/24. A pre-commit hook runs `lint-staged` on staged files, so most
issues are caught before you push.

## Adding a new tokenizer

1. Copy an existing tokenizer directory under `tokenizers/` (e.g. `tokenizers/emphasis`) as a
   starting point, and rename it to `tokenizers/<name>`.
2. Update its `package.json` (`name`, `description`, `repository.directory`, and dependencies).
3. Implement the tokenizer in `src/` (`match.ts`, `parse.ts`, `tokenizer.ts`, `types.ts`,
   `index.ts`). See `@yozora/core-tokenizer` for the tokenizer API.
4. Register it in the relevant parser barrel(s): `packages/parser-gfm/src/index.ts` and/or
   `packages/parser-gfm-ex/src/index.ts`.
5. Add the workspace alias in **both** `tsconfig.json` (`paths`) and `vitest.config.ts`
   (`workspaceAliases`) — these two maps are currently kept in sync by hand.
6. Add fixtures and a spec under `__test__/`, then run `pnpm test`.
7. Run `pnpm doc` to regenerate the package README.

## Commit messages

Follow `:gitmoji: <type>(<scope>): <description>` (e.g.
`:bug: fix(tokenizer): correct delimiter matching`). See the existing git history for examples.

## Releasing

The whole monorepo shares one lockstep version, so there are no per-change changeset files.
Maintainers cut a release with the zero-dependency scripts under `script/version/`:

```bash
pnpm :version <patch|minor|major|x.y.z-tag> --write   # bump all packages + prepend CHANGELOGs
git commit -am ":bookmark:  v<version>" && git tag v<version>
pnpm :publish                                         # build + test + pnpm -r publish
```

The per-package changelog is generated automatically from the conventional-commit subjects since the
previous `v*` tag — tidy commit messages are what feed the release notes. For the first release
after the changesets migration (there is no `v<current>` tag yet), pass `--first-release`.
