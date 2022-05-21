import type { EcmaImport } from '@yozora/ast'
import { EcmaImportType } from '@yozora/ast'
import type { INodeMarkup, INodeMarkupWeaver } from '../types'

/**
 * ECMAScript import statement (single-line).
 *
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#ecmaimport
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/ecma-import
 */
export class EcmaImportMarkupWeaver implements INodeMarkupWeaver<EcmaImport> {
  public readonly type = EcmaImportType
  public readonly isBlockLevel = (): boolean => true

  public weave(node: EcmaImport): INodeMarkup {
    const namedImportStatement: string = node.namedImports
      .map(item => (item.alias ? `${item.src} as ${item.alias}` : item.src))
      .join(', ')

    let importStatement: string = namedImportStatement ? `{ ${namedImportStatement} }` : ''
    if (node.defaultImport) {
      importStatement = importStatement
        ? node.defaultImport + ', ' + importStatement
        : node.defaultImport
    }

    return {
      opener: importStatement
        ? `import ${importStatement} from "${node.moduleName}";`
        : `import "${node.moduleName}";`,
    }
  }
}
