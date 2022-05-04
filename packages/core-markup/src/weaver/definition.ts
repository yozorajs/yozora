import type { Definition } from '@yozora/ast'
import type { INodeMarkup, INodeMarkupWeaver } from '../types'

/**
 * Definition represents a resource.
 *
 * @see https://github.com/syntax-tree/mdast#definition
 * @see https://github.github.com/gfm/#link-reference-definitions
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#definition
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/definition
 */
export class DefinitionMarkupWeaver implements INodeMarkupWeaver<Definition> {
  public readonly couldBeWrapped = false
  public readonly isBlockLevel = true

  public weave(node: Definition): string | INodeMarkup {
    return {
      opener: `[${node.label}]: `,
      content: node.title
        ? `[${node.label}]: ${node.url} "${node.title}"`
        : `[${node.label}]: ${node.url}`,
    }
  }
}
