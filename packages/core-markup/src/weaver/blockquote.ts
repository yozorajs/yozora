import type { Blockquote } from '@yozora/ast'
import type { INodeMarkup, INodeMarkupWeaver } from '../types'

/**
 * Blockquote represents a section quoted from somewhere else.
 *
 * @see https://github.com/syntax-tree/mdast#blockquote
 * @see https://github.github.com/gfm/#block-quotes
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#blockquote
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/blockquote
 */
export class BlockquoteMarkupWeaver implements INodeMarkupWeaver<Blockquote> {
  public readonly couldBeWrapped = true
  public readonly isBlockLevel = true

  public weave(): INodeMarkup {
    return {
      opener: '> ',
      indent: '> ',
    }
  }
}