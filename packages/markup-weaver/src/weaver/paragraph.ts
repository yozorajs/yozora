import type { Paragraph } from '@yozora/ast'
import { ParagraphType } from '@yozora/ast'
import type { INodeMarkup, INodeWeaver } from '../types'

/**
 * Paragraph represents a unit of discourse dealing with a particular point or idea.
 *
 * @see https://github.com/syntax-tree/mdast#paragraph
 * @see https://github.github.com/gfm/#paragraphs
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#paragraph
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/paragraph
 */
export class ParagraphWeaver implements INodeWeaver<Paragraph> {
  public readonly type = ParagraphType
  public readonly isBlockLevel = (): boolean => true

  public weave(): INodeMarkup {
    return {}
  }
}
