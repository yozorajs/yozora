import type { EcmaImport } from '@yozora/ast'
import type { IMarkup, IMarkupWeaver } from '../types'

/**
 * ECMAScript import statement (single-line).
 *
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#ecmaimport
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/ecma-import
 */
export class EcmaImportMarkupWeaver implements IMarkupWeaver<EcmaImport> {
  public readonly couldBeWrapped = false
  public readonly isBlockLevel = true

  public weave(node: EcmaImport): IMarkup | string {
    const namedImportStatement: string = node.namedImports
      .map(item => (item.alias ? `${item.src} as ${item.alias}` : item.src))
      .join(', ')

    let importStatement: string = namedImportStatement ? `{ ${namedImportStatement} }` : ''
    if (node.defaultImport) {
      importStatement = importStatement
        ? node.defaultImport + ', ' + importStatement
        : node.defaultImport
    }
    return `import ${importStatement} from "${node.moduleName}";`
  }
}
