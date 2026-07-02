import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * @typedef {{ name: string, dir: string }} IWorkspacePackage
 */

/**
 * Single source of truth for the `@yozora/* → src` mappings, derived by walking
 * the pnpm workspace (`packages/*` + `tokenizers/*`). Consumed by both
 * `vitest.config.ts` (runtime aliases) and `script/sync-tsconfig-paths.mjs`
 * (writes `tsconfig.json` paths), so the 40+ mappings live in one place instead
 * of two hand-maintained lists that silently drift. tsconfig.test.json enables
 * `allowJs`, and the JSDoc `@returns` below hands tsc the consumer-facing type
 * straight from this file — no separate `.d.ts` / `.d.mts` declaration is needed.
 *
 * The result is sorted by package name with a code-point comparison (not
 * `localeCompare`, which is locale-dependent) so downstream renders are
 * deterministic regardless of the filesystem's `readdir` order — otherwise CI's
 * `git diff --exit-code tsconfig.json` drift guard can fail spuriously when the
 * generator runs on a different platform than the one that committed the file.
 *
 * @param {string} rootDir
 * @returns {IWorkspacePackage[]}
 */
export function workspacePackages(rootDir) {
  const packages = ['packages', 'tokenizers'].flatMap(ws =>
    readdirSync(join(rootDir, ws), { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => {
        const dir = `${ws}/${d.name}`
        let raw
        try {
          raw = readFileSync(join(rootDir, dir, 'package.json'), 'utf8')
        } catch (err) {
          // A directory without a package.json is not a workspace package; skip
          // it. Any other read error (permissions, I/O) is a real fault — surface
          // it instead of silently dropping a package from the alias map.
          if (err.code === 'ENOENT') return null
          throw err
        }
        // A malformed package.json in a real package dir is a mistake worth
        // failing on, so JSON.parse is intentionally left to throw.
        /** @type {{ name?: unknown }} */
        const pkg = JSON.parse(raw)
        // A package dir must declare a string name; a missing/non-string name is
        // a manifest mistake, not a package to silently drop. Non-@yozora names
        // are legitimately skipped (they are not aliased).
        if (typeof pkg.name !== 'string') {
          throw new Error(`Invalid package.json at ${dir}: expected a string "name" field`)
        }
        return pkg.name.startsWith('@yozora/') ? { name: pkg.name, dir } : null
      })
      .filter(p => p != null),
  )
  // Duplicate names would let one alias silently overwrite another in
  // Object.fromEntries / tsconfig paths — a real hazard given the "copy a
  // tokenizer dir and rename" workflow (CONTRIBUTING step 1). Fail fast instead.
  const seen = new Map()
  for (const p of packages) {
    const prev = seen.get(p.name)
    if (prev !== undefined) {
      throw new Error(`Duplicate workspace package name ${p.name} in ${prev} and ${p.dir}`)
    }
    seen.set(p.name, p.dir)
  }
  return packages.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
}
