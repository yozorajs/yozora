#!/usr/bin/env node

/**
 * Sync documentation links in package README files to match current package versions.
 * Updates homepage URLs in package.json and badge URLs in README.md files.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { repositoryRoot } from '../internal/repository.mjs'
import { workspacePackages } from '../internal/workspace.mjs'

const __filename = fileURLToPath(import.meta.url)

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
 * Update homepage URL in package.json
 */
function updatePackageJson(pkg) {
  const pkgJson = pkg.manifest

  const newHomepage = `https://github.com/${REPO_OWNER}/${REPO_NAME}/tree/v${pkgJson.version}/${pkg.dir}#readme`

  if (pkgJson.homepage !== newHomepage) {
    pkgJson.homepage = newHomepage
    writeFileSync(pkg.packageJsonPath, JSON.stringify(pkgJson, null, 2) + '\n', 'utf-8')
    console.log(`Updated homepage in ${pkg.packageJsonPath}`)
    return true
  }

  return false
}

/**
 * Update version badge and links in README.md
 */
function updateReadme(pkg, filename) {
  const packagePath = join(repositoryRoot, pkg.dir)
  const readmePath = join(packagePath, filename)
  if (!existsSync(readmePath)) return false

  let content = readFileSync(readmePath, 'utf-8')

  let updated = false
  const originalContent = content
  content = replaceVersionLinks(content, pkg.manifest.version)

  if (content !== originalContent) {
    writeFileSync(readmePath, content, 'utf-8')
    console.log(`Updated README.md in ${packagePath}`)
    updated = true
  }

  return updated
}

/**
 * Main function
 */
function main() {
  console.log('Syncing documentation links...\n')

  const packages = workspacePackages().filter(pkg => pkg.manifest.private !== true)
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
