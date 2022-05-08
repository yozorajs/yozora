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
    const url: string = node.url || '<>'
    const title: string | null = node.title ? this.escapeTitle(node.title) : null
    return title ? `[${node.label}]: ${url} "${title}"` : `[${node.label}]: ${url}`
  }

  protected escapeTitle(title: string): string {
    return title.replace(/(["])/g, '\\$1')
  }
}
