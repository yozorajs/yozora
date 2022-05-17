import type { Definition } from '@yozora/ast'
import type { IEscaper, INodeMarkup, INodeMarkupWeaver } from '../types'
import { createCharacterEscaper } from '../util'

const _escapeContent: IEscaper = createCharacterEscaper('[]()'.split(''))
const _escapeTitle: IEscaper = createCharacterEscaper('"'.split(''))

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
  public readonly isBlockLevel = (): boolean => true
  public readonly escapeContent: IEscaper = _escapeContent
  protected readonly escapeTitle = _escapeTitle

  public weave(node: Definition): INodeMarkup {
    const url: string = node.url || '<>'
    const title = node.title ? this.escapeTitle(node.title) : undefined
    return {
      opener: '[',
      closer: title ? `]: ${url} "${title}"` : `]: ${url}`,
      content: node.label,
    }
  }
}
