#!/usr/bin/env node

/**
 * Sync documentation links in README.md files to match current package versions.
 * Updates homepage URLs in package.json and badge URLs in README.md files.
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

const REPO_OWNER = 'yozorajs'
const REPO_NAME = 'yozora'

/**
 * Get all workspace package directories
 */
function getWorkspacePackages() {
  const packages = []
  const workspaceDirs = ['packages', 'tokenizers']

  for (const workspaceDir of workspaceDirs) {
    const workspacePath = join(rootDir, workspaceDir)
    try {
      const entries = readdirSync(workspacePath)
      for (const entry of entries) {
        const entryPath = join(workspacePath, entry)
        const stat = statSync(entryPath)
        if (stat.isDirectory()) {
          const pkgJsonPath = join(entryPath, 'package.json')
          try {
            const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'))
            // Skip private packages (they are not published)
            if (pkgJson.private) {
              continue
            }
            packages.push({
              name: pkgJson.name,
              version: pkgJson.version,
              path: entryPath,
              pkgJsonPath,
              directory: `${workspaceDir}/${entry}`,
            })
          } catch {
            // Skip if no package.json
          }
        }
      }
    } catch {
      // Skip if workspace dir doesn't exist
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
function updateReadme(pkg) {
  const readmePath = join(pkg.path, 'README.md')

  let content
  try {
    content = readFileSync(readmePath, 'utf-8')
  } catch {
    // No README.md, skip
    return false
  }

  let updated = false
  const originalContent = content

  // Update npm badge version URL pattern:
  // https://img.shields.io/badge/npm-X.X.X-...
  const npmBadgePattern = new RegExp(
    '(https://img\\.shields\\.io/badge/npm-)([0-9]+\\.[0-9]+\\.[0-9]+)(-[^)]+)',
    'g',
  )
  content = content.replace(npmBadgePattern, `$1${pkg.version}$3`)

  // Update GitHub tree links:
  // https://github.com/yozorajs/yozora/tree/vX.X.X/...
  const treePattern = new RegExp(
    `(https://github\\.com/${REPO_OWNER}/${REPO_NAME}/tree/v)([0-9]+\\.[0-9]+\\.[0-9]+)(/[^)\\s]*)`,
    'g',
  )
  content = content.replace(treePattern, `$1${pkg.version}$3`)

  // Update blob links (for raw file access):
  // https://github.com/yozorajs/yozora/blob/vX.X.X/...
  const blobPattern = new RegExp(
    `(https://github\\.com/${REPO_OWNER}/${REPO_NAME}/blob/v)([0-9]+\\.[0-9]+\\.[0-9]+)(/[^)\\s]*)`,
    'g',
  )
  content = content.replace(blobPattern, `$1${pkg.version}$3`)

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
    const readmeUpdated = updateReadme(pkg)

    if (pkgUpdated || readmeUpdated) {
      updatedCount += 1
    }
  }

  console.log(`\nDone! Updated ${updatedCount} packages.`)
}

main()
