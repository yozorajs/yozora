import type { Footnote } from '@yozora/ast'
import type { IMarkup, IMarkupWeaver } from '../types'

/**
 * Footnote represents content relating to the document that is outside its flow.
 *
 * @see https://github.com/syntax-tree/mdast#footnote
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#footnote
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/footnote
 */
export class FootnoteMarkupWeaver implements IMarkupWeaver<Footnote> {
  public readonly couldBeWrapped = true
  public readonly isBlockLevel = false

  public weave(): string | IMarkup {
    return {
      opener: '^[',
      closer: ']',
    }
  }
}
