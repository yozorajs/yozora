import path from 'path'
import { renderMarkdown } from './util'

interface HandlebarData {
  packageName: string
  shortPackageName?: string
  packageDirectory: string
  parserName: string
}

const items: HandlebarData[] = [
  // Top README
  {
    packageName: '@yozora/root',
    packageDirectory: '.',
    parserName: '',
  },
  // parser
  {
    packageName: '@yozora/parser',
    packageDirectory: 'packages/parser',
    parserName: 'YozoraParser',
  },
  // gfm-parser
  {
    packageName: '@yozora/parser-gfm',
    packageDirectory: 'packages/parser-gfm',
    parserName: 'GfmParser',
  },
  // gfm-ex-parser
  {
    packageName: '@yozora/parser-gfm-ex',
    packageDirectory: 'packages/parser-gfm-ex',
    parserName: 'GfmExParser',
  },
]

// Perform replace
items.forEach((item): void => {
  const data = item
  data.shortPackageName = data.packageName.replace(/^@[^/]*\//, '')
  const docFilepath = path.join(
    __dirname,
    '../../',
    data.packageDirectory,
    'README.md',
  )
  renderMarkdown<HandlebarData>(docFilepath, data)
})
