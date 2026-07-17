import { readFileSync } from 'node:fs'

/**
 * Read and validate a workspace package manifest.
 *
 * @param {string} filepath
 * @param {{ allowMissing?: boolean }} options
 * @returns {Record<string, unknown> | null}
 */
export function readPackageJson(filepath, { allowMissing = false } = {}) {
  let raw
  try {
    raw = readFileSync(filepath, 'utf8')
  } catch (err) {
    if (allowMissing && err.code === 'ENOENT') return null
    throw err
  }

  const pkg = JSON.parse(raw)
  if (pkg == null || Array.isArray(pkg) || typeof pkg !== 'object') {
    throw new TypeError(`Invalid package.json at ${filepath}: expected an object`)
  }
  if (typeof pkg.name !== 'string' || pkg.name.length === 0) {
    throw new TypeError(`Invalid package.json at ${filepath}: expected a non-empty string "name"`)
  }
  if (pkg.private !== undefined && typeof pkg.private !== 'boolean') {
    throw new TypeError(`Invalid package.json at ${filepath}: expected "private" to be a boolean`)
  }
  if (pkg.private !== true && (typeof pkg.version !== 'string' || pkg.version.length === 0)) {
    throw new TypeError(
      `Invalid package.json at ${filepath}: expected a non-empty string "version"`,
    )
  }
  return pkg
}
