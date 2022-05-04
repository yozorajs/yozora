import type { Blockquote } from '@yozora/ast'
import type { IMarkup, IMarkupWeaver } from '../types'

/**
 * Blockquote represents a section quoted from somewhere else.
 *
 * @see https://github.com/syntax-tree/mdast#blockquote
 * @see https://github.github.com/gfm/#block-quotes
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#blockquote
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/blockquote
 */
export class BlockquoteMarkupWeaver implements IMarkupWeaver<Blockquote> {
  public readonly couldBeWrapped = true
  public readonly isBlockLevel = true

  public weave(): string | IMarkup {
    return {
      opener: '> ',
      indent: '> ',
    }
  }
}
