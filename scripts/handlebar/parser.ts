import fs from 'node:fs'
import path from 'node:path'
import { ensureLeadingTemplateRegion, renderMarkdown, SCRIPT_DIRPATH } from './util'

interface HandlebarData {
  packageName: string
  repositoryRef: string
  shortPackageName?: string
  packageDirectory: string
  parserName?: string
}

interface PackageJson {
  name: string
  version: string
  private?: boolean
}

const PARSER_NAMES: Readonly<Record<string, string>> = {
  '@yozora/parser': 'YozoraParser',
  '@yozora/parser-gfm': 'GfmParser',
  '@yozora/parser-gfm-ex': 'GfmExParser',
}

const packagesDirpath = path.join(SCRIPT_DIRPATH, '../../packages')
const packageItems: HandlebarData[] = fs
  .readdirSync(packagesDirpath, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .flatMap(entry => {
    const packageDirectory = `packages/${entry.name}`
    const packageJsonFilepath = path.join(packagesDirpath, entry.name, 'package.json')
    if (!fs.existsSync(packageJsonFilepath)) return []

    const packageJson = JSON.parse(fs.readFileSync(packageJsonFilepath, 'utf-8')) as PackageJson
    if (packageJson.private === true) return []

    return [
      {
        packageName: packageJson.name,
        repositoryRef: `v${packageJson.version}`,
        packageDirectory,
        parserName: PARSER_NAMES[packageJson.name],
      },
    ]
  })

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
    const docFilepath = path.join(SCRIPT_DIRPATH, '../../', data.packageDirectory, filename)
    if (!fs.existsSync(docFilepath)) continue

    if (data.packageDirectory !== '.') {
      ensureLeadingTemplateRegion(docFilepath, 'tokenizer/banner')
    }
    renderMarkdown<HandlebarData>(docFilepath, data)
  }
})
