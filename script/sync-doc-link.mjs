#!/usr/bin/env node

/**
 * Sync documentation links in package README files to match current package versions.
 * Updates homepage URLs in package.json and badge URLs in README.md files.
 */

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readPackageJson } from './package-json.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

const REPO_OWNER = 'yozorajs'
const REPO_NAME = 'yozora'
const VERSION_PATTERN =
  '[0-9]+\\.[0-9]+\\.[0-9]+(?:-[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?'
const TREE_LINK_PATTERN = new RegExp(
  `(https://github\\.com/${REPO_OWNER}/${REPO_NAME}/tree/v)(${VERSION_PATTERN})(/[^)\\s]*)`,
  'g',
)
const BLOB_LINK_PATTERN = new RegExp(
  `(https://github\\.com/${REPO_OWNER}/${REPO_NAME}/blob/v)(${VERSION_PATTERN})(/[^)\\s]*)`,
  'g',
)

/**
 * Replace versioned repository links.
 * @param {string} content
 * @param {string} version
 */
export function replaceVersionLinks(content, version) {
  return content
    .replace(TREE_LINK_PATTERN, `$1${version}$3`)
    .replace(BLOB_LINK_PATTERN, `$1${version}$3`)
}

/**
 * Get all workspace package directories
 */
function getWorkspacePackages() {
  const packages = []
  const workspaceDirs = ['packages', 'tokenizers']

  for (const workspaceDir of workspaceDirs) {
    const workspacePath = join(rootDir, workspaceDir)
    const entries = readdirSync(workspacePath)
    for (const entry of entries) {
      const entryPath = join(workspacePath, entry)
      const stat = statSync(entryPath)
      if (stat.isDirectory()) {
        const pkgJsonPath = join(entryPath, 'package.json')
        const pkgJson = readPackageJson(pkgJsonPath, { allowMissing: true })
        if (pkgJson == null || pkgJson.private) continue
        packages.push({
          name: pkgJson.name,
          version: pkgJson.version,
          path: entryPath,
          pkgJsonPath,
          directory: `${workspaceDir}/${entry}`,
        })
      }
    }
  }

  return packages
}

/**
 * Update homepage URL in package.json
 */
function updatePackageJson(pkg) {
  const content = readFileSync(pkg.pkgJsonPath, 'utf-8')
  const pkgJson = JSON.parse(content)

  const newHomepage = `https://github.com/${REPO_OWNER}/${REPO_NAME}/tree/v${pkg.version}/${pkg.directory}#readme`

  if (pkgJson.homepage !== newHomepage) {
    pkgJson.homepage = newHomepage
    writeFileSync(pkg.pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n', 'utf-8')
    console.log(`Updated homepage in ${pkg.pkgJsonPath}`)
    return true
  }

  return false
}

/**
 * Update version badge and links in README.md
 */
function updateReadme(pkg, filename) {
  const readmePath = join(pkg.path, filename)
  if (!existsSync(readmePath)) return false

  let content = readFileSync(readmePath, 'utf-8')

  let updated = false
  const originalContent = content
  content = replaceVersionLinks(content, pkg.version)

  if (content !== originalContent) {
    writeFileSync(readmePath, content, 'utf-8')
    console.log(`Updated README.md in ${pkg.path}`)
    updated = true
  }

  return updated
}

/**
 * Main function
 */
function main() {
  console.log('Syncing documentation links...\n')

  const packages = getWorkspacePackages()
  console.log(`Found ${packages.length} packages\n`)

  let updatedCount = 0

  for (const pkg of packages) {
    const pkgUpdated = updatePackageJson(pkg)
    const readmeUpdated = ['README.md', 'README-zh.md']
      .map(filename => updateReadme(pkg, filename))
      .some(Boolean)

    if (pkgUpdated || readmeUpdated) {
      updatedCount += 1
    }
  }

  console.log(`\nDone! Updated ${updatedCount} packages.`)
}

if (process.argv[1] === __filename) main()
