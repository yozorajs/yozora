import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { readPackageJson } from './package-json.mjs'
import { repositoryRoot } from './repository.mjs'

const WORKSPACE_DIRECTORIES = ['packages', 'tokenizers']

/**
 * @typedef {object} WorkspacePackage
 * @property {string} name
 * @property {string} dir Repository-relative package directory.
 * @property {string} packageJsonPath
 * @property {import('./package-json.mjs').PackageJson} manifest
 */

/**
 * Read every package declared by the repository's directory-based pnpm workspace.
 * Missing package.json files are ignored; malformed manifests and duplicate names
 * abort so downstream generators cannot silently produce partial output.
 *
 * @param {string} rootDir
 * @returns {WorkspacePackage[]}
 */
export function workspacePackages(rootDir = repositoryRoot) {
  const packages = WORKSPACE_DIRECTORIES.flatMap(workspaceDirectory =>
    readdirSync(join(rootDir, workspaceDirectory), { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => {
        const dir = `${workspaceDirectory}/${entry.name}`
        const packageJsonPath = join(rootDir, dir, 'package.json')
        const manifest = readPackageJson(packageJsonPath, { allowMissing: true })
        return manifest == null ? null : { name: manifest.name, dir, packageJsonPath, manifest }
      })
      .filter(pkg => pkg != null),
  )

  const seen = new Map()
  for (const pkg of packages) {
    const previousDirectory = seen.get(pkg.name)
    if (previousDirectory !== undefined) {
      throw new Error(
        `Duplicate workspace package name ${pkg.name} in ${previousDirectory} and ${pkg.dir}`,
      )
    }
    seen.set(pkg.name, pkg.dir)
  }

  return packages.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
}

/** Workspace packages addressable through the repository's @yozora/* aliases. */
export function yozoraWorkspacePackages(rootDir = repositoryRoot) {
  return workspacePackages(rootDir).filter(pkg => pkg.name.startsWith('@yozora/'))
}
