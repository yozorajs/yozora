import type { EcmaImport } from '@yozora/ast'
import { EcmaImportType } from '@yozora/ast'
import type { INodeMarkup, INodeWeaver } from '../types'

/**
 * ECMAScript import statement (single-line).
 *
 * @see https://github.com/yozorajs/yozora/tree/release-2.x.x/packages/ast#ecmaimport
 * @see https://github.com/yozorajs/yozora/tree/release-2.x.x/tokenizers/ecma-import
 */
export class EcmaImportWeaver implements INodeWeaver<EcmaImport> {
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
