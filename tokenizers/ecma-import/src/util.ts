import type { IEcmaImportNamedImport } from '@yozora/ast'

const namedImportItemRegex = /^(\w+)(?:\s+as\s+(\w+))?$/
const namedImportRegex = /\{\s*((?:[\w]+(?:\s+as\s+[\w]+)?\s*,\s*)*[\w]+(?:\s+as\s+[\w]+)?)\s*\}\s*/
const endRegex = /\s*;*\s*$/

/**
 * import '@yozora.parser'
 */
export const regex1 = new RegExp(/^import\s+(['"])([^'"]+)\1/.source + endRegex.source)

/**
 * import Parser from '@yozora/parser'
 */
export const regex2 = new RegExp(
  /^import\s+([\w]+)\s+from\s+(['"])([^'"]+)\2/.source + endRegex.source,
)

/**
 * import Parser, { YozoraParser } from '@yozora/parser'
 * import Parser, { YozoraParser as Parser } from '@yozora/parser'
 * import Parser, { YozoraParser, YozoraParser as Parser } from '@yozora/parser'
 * import { YozoraParser } from '@yozora/parser'
 * import { YozoraParser as Parser } from '@yozora/parser'
 * import { YozoraParser, YozoraParser as Parser } from '@yozora/parser'
 */
export const regex3 = new RegExp(
  '^import\\s+(?:([\\w]+)\\s*,\\s*)?' +
    namedImportRegex.source +
    'from\\s+([\'"])([^\'"]+)\\3' +
    endRegex.source,
)

/**
 *
 * @param text
 */
export function resolveNameImports(text: string): IEcmaImportNamedImport[] {
  const items = text.split(/\s*,\s*/g).filter(item => item.length > 0)
  const result: IEcmaImportNamedImport[] = []
  for (const item of items) {
    const [, src, alias] = namedImportItemRegex.exec(item)!
    result.push({ src, alias: alias == null ? null : alias })
  }
  return result
}
