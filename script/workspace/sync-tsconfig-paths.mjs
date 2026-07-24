import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { format, resolveConfig } from 'prettier'
import { repositoryRoot } from '../internal/repository.mjs'
import { yozoraWorkspacePackages } from '../internal/workspace.mjs'

/**
 * Regenerate `tsconfig.json` compilerOptions.paths from the single source of
 * truth (the pnpm workspace). Run via `pnpm sync:paths`; CI asserts it is
 * committed (no drift) with `git diff --exit-code tsconfig.json`. Output is run
 * through Prettier so the file stays format-check clean and the sync is
 * idempotent.
 */
const tsconfigPath = join(repositoryRoot, 'tsconfig.json')

const paths = {}
const packages = yozoraWorkspacePackages()
for (const { name, dir } of packages) {
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
console.log(`Synced ${packages.length} @yozora/* paths into tsconfig.json`)
