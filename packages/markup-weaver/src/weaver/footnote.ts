import type { Footnote } from '@yozora/ast'
import { FootnoteType } from '@yozora/ast'
import type { INodeMarkup, INodeWeaver } from '../types'

/**
 * Footnote represents content relating to the document that is outside its flow.
 *
 * @see https://github.com/syntax-tree/mdast#footnote
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#footnote
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/footnote
 */
export class FootnoteWeaver implements INodeWeaver<Footnote> {
  public readonly type = FootnoteType
  public readonly isBlockLevel = (): boolean => false

  public weave(): INodeMarkup {
    return {
      opener: '^[',
      closer: ']',
    }
  }
}
