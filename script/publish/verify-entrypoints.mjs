import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { repositoryRoot } from '../internal/repository.mjs'
import { workspacePackages } from '../internal/workspace.mjs'

let entrypointCount = 0

for (const ws of workspacePackages()) {
  const packageDir = path.join(repositoryRoot, ws.dir)
  const entry = ws.manifest.exports?.['.'] ?? ws.manifest.exports

  if (ws.manifest.private === true) continue
  assert.equal(typeof entry?.require, 'string', `${ws.name} is missing a CJS entrypoint`)
  assert.equal(typeof entry.import, 'string', `${ws.name} is missing an ESM entrypoint`)

  const require = createRequire(ws.packageJsonPath)
  require(ws.name)
  await import(pathToFileURL(path.join(packageDir, entry.import)))
  entrypointCount += 1
}

assert.ok(entrypointCount > 0, 'expected at least one dual CJS/ESM package entrypoint')
console.log(`Loaded ${entrypointCount} package entrypoints through both CJS and ESM.`)
