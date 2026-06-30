#!/usr/bin/env node

/**
 * Copy the root LICENSE into every published (non-private) workspace package so
 * the file referenced by each package.json `"files": ["LICENSE"]` exists in the
 * published tarball. Copies are gitignored and produced at publish time.
 */

import { copyFileSync, existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const licensePath = join(rootDir, 'LICENSE')

const workspaceDirs = ['packages', 'tokenizers']

let count = 0
for (const workspaceDir of workspaceDirs) {
  const workspacePath = join(rootDir, workspaceDir)
  if (!existsSync(workspacePath)) continue

  for (const entry of readdirSync(workspacePath)) {
    const packageDir = join(workspacePath, entry)
    if (!statSync(packageDir).isDirectory()) continue

    const pkgJsonPath = join(packageDir, 'package.json')
    if (!existsSync(pkgJsonPath)) continue

    const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'))
    if (pkgJson.private) continue // skip private packages (not published)

    copyFileSync(licensePath, join(packageDir, 'LICENSE'))
    count += 1
  }
}

console.log(`Copied LICENSE into ${count} packages.`)
