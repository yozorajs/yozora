import type { Blockquote } from '@yozora/ast'
import { BlockquoteType } from '@yozora/ast'
import type { INodeMarkup, INodeWeaver } from '../types'

/**
 * Blockquote represents a section quoted from somewhere else.
 *
 * @see https://github.com/syntax-tree/mdast#blockquote
 * @see https://github.github.com/gfm/#block-quotes
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#blockquote
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/blockquote
 */
export class BlockquoteWeaver implements INodeWeaver<Blockquote> {
  public readonly type = BlockquoteType
  public readonly isBlockLevel = (): boolean => true

  public weave(): INodeMarkup {
    return {
      opener: '> ',
      indent: '> ',
    }
  }
}
