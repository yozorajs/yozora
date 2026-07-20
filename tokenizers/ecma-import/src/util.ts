import type { IEcmaImportNamedImport } from '@yozora/ast'

const identifierStartPattern = String.raw`[$_\p{ID_Start}]`
const identifierPartPattern = String.raw`[$_\u200C\u200D\p{ID_Continue}]`
const identifierNamePattern = `${identifierStartPattern}${identifierPartPattern}*`
const identifierNameRegex = new RegExp(`^${identifierNamePattern}$`, 'u')
const invalidBindingIdentifiers: ReadonlySet<string> = new Set<string>([
  'arguments',
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'eval',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'function',
  'if',
  'implements',
  'import',
  'in',
  'instanceof',
  'interface',
  'let',
  'new',
  'null',
  'package',
  'private',
  'protected',
  'public',
  'return',
  'static',
  'super',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'yield',
])
const namedImportItemPattern = `${identifierNamePattern}(?:\\s+as\\s+${identifierNamePattern})?`
const namedImportItemRegex = new RegExp(
  `^(${identifierNamePattern})(?:\\s+as\\s+(${identifierNamePattern}))?$`,
  'u',
)
const namedImportRegex = new RegExp(
  `\\{\\s*((?:${namedImportItemPattern}\\s*,\\s*)*${namedImportItemPattern})\\s*\\}\\s*`,
  'u',
)
const endRegex = /\s*;?\s*$/u

/**
 * import '@yozora.parser'
 */
export const regex1 = new RegExp(/^import\s+(['"])([^'"]+)\1/.source + endRegex.source, 'u')

/**
 * import Parser from '@yozora/parser'
 */
export const regex2 = new RegExp(
  `^import\\s+(${identifierNamePattern})\\s+from\\s+(['"])([^'"]+)\\2${endRegex.source}`,
  'u',
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
  `^import\\s+(?:(${identifierNamePattern})\\s*,\\s*)?` +
    namedImportRegex.source +
    'from\\s+([\'"])([^\'"]+)\\3' +
    endRegex.source,
  'u',
)

/**
 * Check whether an unescaped IdentifierName can be used as a local binding in a module.
 */
export function isBindingIdentifier(identifier: string): boolean {
  return identifierNameRegex.test(identifier) && !invalidBindingIdentifiers.has(identifier)
}

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
