import type { FootnoteReference } from '@yozora/ast'
import type { IMarkup, IMarkupWeaver } from '../types'

/**
 * FootnoteReference represents a marker through association.
 *
 * Similar to imageReference and linkReference, the difference is that it has
 * only 'collapsed' reference type instead of 'full' and 'shortcut'
 *
 * @see https://github.com/syntax-tree/mdast#footnotereference
 * @see https://github.com/syntax-tree/mdast#imagereference
 * @see https://github.com/syntax-tree/mdast#linkreference
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#footnotereference
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/footnote-reference
 */
export class FootnoteReferenceMarkupWeaver implements IMarkupWeaver<FootnoteReference> {
  public readonly couldBeWrapped = false
  public readonly isBlockLevel = false

  public weave(node: FootnoteReference): string | IMarkup {
    return `[^${node.label}]`
  }
}
