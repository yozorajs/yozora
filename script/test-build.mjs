import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { readPackageJson } from './package-json.mjs'
import { workspacePackages } from './workspace-aliases.mjs'

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
let entrypointCount = 0

for (const ws of workspacePackages(rootDir)) {
  const packageDir = path.join(rootDir, ws.dir)
  const manifestPath = path.join(packageDir, 'package.json')
  const manifest = readPackageJson(manifestPath)
  const entry = manifest.exports?.['.'] ?? manifest.exports

  if (manifest.private === true) continue
  assert.equal(typeof entry?.require, 'string', `${ws.name} is missing a CJS entrypoint`)
  assert.equal(typeof entry.import, 'string', `${ws.name} is missing an ESM entrypoint`)

  const require = createRequire(manifestPath)
  require(ws.name)
  await import(pathToFileURL(path.join(packageDir, entry.import)))
  entrypointCount += 1
}

assert.ok(entrypointCount > 0, 'expected at least one dual CJS/ESM package entrypoint')
console.log(`Loaded ${entrypointCount} package entrypoints through both CJS and ESM.`)
