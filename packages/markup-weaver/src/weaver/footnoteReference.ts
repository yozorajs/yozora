import type { FootnoteReference } from '@yozora/ast'
import { FootnoteReferenceType } from '@yozora/ast'
import type { INodeMarkup, INodeWeaver } from '../types'

/**
 * FootnoteReference represents a marker through association.
 *
 * Similar to imageReference and linkReference, the difference is that it has
 * only 'collapsed' reference type instead of 'full' and 'shortcut'
 *
 * @see https://github.com/syntax-tree/mdast#footnotereference
 * @see https://github.com/syntax-tree/mdast#imagereference
 * @see https://github.com/syntax-tree/mdast#linkreference
 * @see https://github.com/yozorajs/yozora/tree/release-2.x.x/packages/ast#footnotereference
 * @see https://github.com/yozorajs/yozora/tree/release-2.x.x/tokenizers/footnote-reference
 */
export class FootnoteReferenceWeaver implements INodeWeaver<FootnoteReference> {
  public readonly type = FootnoteReferenceType
  public readonly isBlockLevel = (): boolean => false

  public weave(node: FootnoteReference): INodeMarkup {
    return {
      opener: '[^',
      closer: ']',
      content: node.label,
    }
  }
}
