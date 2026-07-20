import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { format, resolveConfig } from 'prettier'
import { workspacePackages } from './workspace-aliases.mjs'

/**
 * Regenerate `tsconfig.json` compilerOptions.paths from the single source of
 * truth (the pnpm workspace). Run via `pnpm sync:paths`; CI asserts it is
 * committed (no drift) with `git diff --exit-code tsconfig.json`. Output is run
 * through Prettier so the file stays format-check clean and the sync is
 * idempotent.
 */
const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const tsconfigPath = join(rootDir, 'tsconfig.json')

const paths = {}
for (const { name, dir } of workspacePackages(rootDir)) {
  paths[name] = [`./${dir}/src`]
}
paths['vitest.setup'] = ['./vitest.setup.ts']

const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf8'))
tsconfig.compilerOptions.paths = paths

const prettierConfig = await resolveConfig(tsconfigPath)
const formatted = await format(JSON.stringify(tsconfig), {
  ...prettierConfig,
  parser: 'json',
  filepath: tsconfigPath,
})
writeFileSync(tsconfigPath, formatted)
console.log(`Synced ${workspacePackages(rootDir).length} @yozora/* paths into tsconfig.json`)
