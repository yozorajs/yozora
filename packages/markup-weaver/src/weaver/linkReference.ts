import type { LinkReference } from '@yozora/ast'
import { LinkReferenceType } from '@yozora/ast'
import type { IEscaper, INodeMarkup, INodeMarkupWeaveContext, INodeWeaver } from '../types'
import { createCharacterEscaper } from '../util'

const _escapeContent: IEscaper = createCharacterEscaper('[]()`'.split(''))

/**
 * LinkReference represents a hyperlink through association, or its original
 * source if there is no association.
 *
 * @see https://github.com/syntax-tree/mdast#linkreference
 * @see https://github.github.com/gfm/#reference-link
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#linkreference
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/link-reference
 */
export class LinkReferenceWeaver implements INodeWeaver<LinkReference> {
  public readonly type = LinkReferenceType
  public readonly isBlockLevel = (): boolean => false
  public readonly escapeContent: IEscaper = _escapeContent

  public weave(node: LinkReference, ctx: INodeMarkupWeaveContext): INodeMarkup {
    const content: string = ctx.weaveInlineNodes(node.children)
    return {
      opener: '[',
      closer: content === node.label ? '][]' : `][${node.label}]`,
    }
  }
}
