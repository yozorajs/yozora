// @ts-check

import fs from 'node:fs'
import path from 'node:path'
import { repositoryRoot } from '../internal/repository.mjs'
import { workspacePackages } from '../internal/workspace.mjs'
import { ensureLeadingTemplateRegion, renderMarkdown } from './render.mjs'

/**
 * @typedef {object} HandlebarData
 * @property {string} packageName
 * @property {string} repositoryRef
 * @property {string} [shortPackageName]
 * @property {string} packageDirectory
 * @property {string} [parserName]
 */

/** @type {Readonly<Record<string, string>>} */
const PARSER_NAMES = {
  '@yozora/parser': 'YozoraParser',
  '@yozora/parser-gfm': 'GfmParser',
  '@yozora/parser-gfm-ex': 'GfmExParser',
}

/** @type {HandlebarData[]} */
const packageItems = workspacePackages()
  .filter(
    pkg =>
      (pkg.dir.startsWith('packages/') ||
        pkg.dir.startsWith('markup/') ||
        pkg.name === '@yozora/tokenizer') &&
      pkg.manifest.private !== true,
  )
  .map(pkg => ({
    packageName: pkg.name,
    repositoryRef: `v${pkg.manifest.version}`,
    packageDirectory: pkg.dir,
    parserName: PARSER_NAMES[pkg.name],
  }))

const rootManifest = JSON.parse(fs.readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8'))

/** @type {HandlebarData[]} */
const items = [
  // Top README
  {
    packageName: '@yozora/root',
    repositoryRef: `v${rootManifest.version}`,
    packageDirectory: '.',
  },
  ...packageItems,
]

// Perform replace
items.forEach(item => {
  const data = item
  data.shortPackageName = data.packageName.replace(/^@[^/]*\//, '')

  for (const filename of ['README.md', 'README-zh.md']) {
    const docFilepath = path.join(repositoryRoot, data.packageDirectory, filename)
    if (!fs.existsSync(docFilepath)) continue

    if (data.packageDirectory !== '.') {
      ensureLeadingTemplateRegion(docFilepath, 'tokenizer/banner')
    }
    renderMarkdown(docFilepath, data)
  }
})
