import fs from 'node:fs'
import path from 'node:path'
import { repositoryRoot } from '../internal/repository.mjs'
import { workspacePackages } from '../internal/workspace.mjs'
import { ensureLeadingTemplateRegion, renderMarkdown } from './render'

interface HandlebarData {
  packageName: string
  repositoryRef: string
  shortPackageName?: string
  packageDirectory: string
  parserName?: string
}

const PARSER_NAMES: Readonly<Record<string, string>> = {
  '@yozora/parser': 'YozoraParser',
  '@yozora/parser-gfm': 'GfmParser',
  '@yozora/parser-gfm-ex': 'GfmExParser',
}

const packageItems: HandlebarData[] = workspacePackages()
  .filter(pkg => pkg.dir.startsWith('packages/') && pkg.manifest.private !== true)
  .map(pkg => ({
    packageName: pkg.name,
    repositoryRef: `v${pkg.manifest.version}`,
    packageDirectory: pkg.dir,
    parserName: PARSER_NAMES[pkg.name],
  }))

const items: HandlebarData[] = [
  // Top README
  {
    packageName: '@yozora/root',
    repositoryRef: 'release-2.x.x',
    packageDirectory: '.',
  },
  ...packageItems,
]

// Perform replace
items.forEach((item): void => {
  const data = item
  data.shortPackageName = data.packageName.replace(/^@[^/]*\//, '')

  for (const filename of ['README.md', 'README-zh.md']) {
    const docFilepath = path.join(repositoryRoot, data.packageDirectory, filename)
    if (!fs.existsSync(docFilepath)) continue

    if (data.packageDirectory !== '.') {
      ensureLeadingTemplateRegion(docFilepath, 'tokenizer/banner')
    }
    renderMarkdown<HandlebarData>(docFilepath, data)
  }
})
