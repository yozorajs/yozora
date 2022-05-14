import type { LinkReference } from '@yozora/ast'
import type { IEscaper, INodeMarkup, INodeMarkupWeaver } from '../types'
import { createCharacterEscaper } from '../util'

const _escapeContent: IEscaper = createCharacterEscaper('[]()'.split(''))

/**
 * LinkReference represents a hyperlink through association, or its original
 * source if there is no association.
 *
 * @see https://github.com/syntax-tree/mdast#linkreference
 * @see https://github.github.com/gfm/#reference-link
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#linkreference
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/link-reference
 */
export class LinkReferenceMarkupWeaver implements INodeMarkupWeaver<LinkReference> {
  public readonly couldBeWrapped = true
  public readonly isBlockLevel = false
  public readonly escapeContent: IEscaper = _escapeContent

  public weave(node: LinkReference): INodeMarkup {
    return {
      opener: '[',
      closer: `][${node.label}]`,
    }
  }
}