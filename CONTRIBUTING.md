# Contributing to Yozora

Thanks for your interest in contributing! This guide covers the local setup and the common
workflows.

## Prerequisites

- **Node.js** `^22.18.0 || ^24.11.0 || >=26.0.0`
- **pnpm** — the repo pins a version via the `packageManager` field; run `corepack enable` to pick
  it up automatically.

## Setup

```bash
pnpm install
```

This installs all workspace dependencies and sets up the git hooks via `@guanghechen/githooks`.

## Common commands

| Command              | Description                                             |
| :------------------- | :------------------------------------------------------ |
| `pnpm build`         | Build all packages (tsdown, dual ESM/CJS + `.d.ts`)     |
| `pnpm test`          | Run the test suites (vitest)                            |
| `pnpm test:coverage` | Run tests with coverage                                 |
| `pnpm lint`          | Check lint, imports, and formatting with Biome          |
| `pnpm typecheck`     | Type-check with `tsc --noEmit`                          |
| `pnpm doc:check`     | Validate Markdown structure and local links             |
| `pnpm spellcheck`    | Spell-check sources with cspell                         |
| `pnpm format`        | Auto-fix with Biome; format Markdown/YAML with Prettier |
| `pnpm doc`           | Regenerate package READMEs from Handlebars templates    |

CI runs `lint`, `typecheck`, `format:check`, `doc:check`, and `spellcheck` (the `check` job), plus
`build` + `test:coverage` across Node 22/24/26. A pre-commit hook runs `lint-staged` on staged
files, so most issues are caught before you push.

Biome handles JavaScript, TypeScript, and JSON. Prettier remains available for Markdown/YAML and the
fixture and tsconfig generation scripts. Generated fixtures and build output are excluded from Biome
checks.

Builds use tsdown and preserve `lib/esm/index.mjs`, `lib/cjs/index.cjs`, and `lib/types/index.d.ts`.
`pnpm build` includes JavaScript source maps; `pnpm build:production` omits them. Use named imports
between workspace packages so CJS bundles retain the same interop behavior as ESM. Public default
exports remain available.

`pnpm test:build` checks package-name imports in both formats, exercises the built parsers, and
compiles ESM/CJS TypeScript consumers against the public declarations. Run it after either build
mode.

Documentation generators are native ESM scripts, type-checked through JSDoc and `@ts-check`.
Documentation checks and their tests bundle the parser sources with tsdown into a temporary
directory that is removed after loading, so they do not require a package build first.

## Adding a new tokenizer

1. Copy an existing tokenizer directory under `tokenizers/` (e.g. `tokenizers/emphasis`) as a
   starting point, and rename it to `tokenizers/<name>`.
2. Update its `package.json` (`name`, `description`, `repository.directory`, and dependencies).
3. Implement the tokenizer in `src/` (`match.ts`, `parse.ts`, `tokenizer.ts`, `types.ts`,
   `index.ts`). See `@yozora/core-tokenizer` for the tokenizer API.
4. Register it in the relevant parsers: `packages/parser/src/index.ts`,
   `packages/parser-gfm/src/index.ts`, and/or `packages/parser-gfm-ex/src/index.ts`.
5. Run `pnpm sync:paths` to register the workspace alias in `tsconfig.json` (vitest resolves the
   `@yozora/*` aliases automatically at runtime from the workspace, so it needs no manual edit).
6. Add fixtures and a spec under `__test__/`, then run `pnpm test`.
7. Add its metadata and example to `script/docs/generate-tokenizers.mjs`, then run `pnpm doc` to
   regenerate the package README.

## Commit messages

Follow `:gitmoji: <type>(<scope>): <description>` (e.g.
`:bug: fix(tokenizer): correct delimiter matching`). See the existing git history for examples.

## Releasing

The whole monorepo shares one lockstep version, so there are no per-change changeset files.
Maintainers cut a release with the zero-dependency scripts under `script/release/`:

```bash
pnpm :version <patch|minor|major|x.y.z-tag> --write   # bump all packages + prepend CHANGELOGs
git commit -am ":bookmark: chore(release): v<version>" && git tag v<version>
pnpm :publish                                         # build + test + pnpm -r publish
```

The per-package changelog is generated automatically from the conventional-commit subjects since the
previous `v*` tag — tidy commit messages are what feed the release notes. Use `--first-release` only
when bootstrapping a history without a previous release tag.
