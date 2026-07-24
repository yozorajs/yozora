#!/usr/bin/env node

/**
 * Copy the root LICENSE into every published (non-private) workspace package so
 * the file referenced by each package.json `"files": ["LICENSE"]` exists in the
 * published tarball. Copies are gitignored and produced at publish time.
 */

import { copyFileSync } from 'node:fs'
import { join } from 'node:path'
import { repositoryRoot } from '../internal/repository.mjs'
import { workspacePackages } from '../internal/workspace.mjs'

const licensePath = join(repositoryRoot, 'LICENSE')

let count = 0
for (const pkg of workspacePackages()) {
  if (pkg.manifest.private === true) continue
  copyFileSync(licensePath, join(repositoryRoot, pkg.dir, 'LICENSE'))
  count += 1
}

console.log(`Copied LICENSE into ${count} packages.`)
