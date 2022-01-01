import type { IEcmaImportNamedImport } from '@yozora/ast'

const namedImportItemRegex = /^(\w+)(?:\s+as\s+(\w+))?$/
const namedImportRegex =
  /\{\s*((?:[\w]+(?:\s+as\s+[\w]+)?\s*,\s*)*[\w]+(?:\s+as\s+[\w]+)?)\s*\}\s*/

/**
 * import '@yozora.parser'
 */
export const regex1 = /^import\s+(['"])([^'"]+)\1$/

/**
 * import Parser from '@yozora/parser'
 */
export const regex2 = /^import\s+([\w]+)\s+from\s+(['"])([^'"]+)\2$/

/**
 * import Parser, { YozoraParser } from '@yozora/parser'
 * import Parser, { YozoraParser as Parser } from '@yozora/parser'
 * import Parser, { YozoraParser, YozoraParser as Parser } from '@yozora/parser'
 * import { YozoraParser } from '@yozora/parser'
 * import { YozoraParser as Parser } from '@yozora/parser'
 * import { YozoraParser, YozoraParser as Parser } from '@yozora/parser'
 */
export const regex3 = new RegExp(
  /^import\s+(?:([\w]+)\s*,\s*)?/.source +
    namedImportRegex.source +
    /from\s+(['"])([^'"]+)\3$/.source,
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
