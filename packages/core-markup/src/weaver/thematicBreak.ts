import type { ThematicBreak } from '@yozora/ast'
import type { INodeMarkup, INodeMarkupWeaver } from '../types'

/**
 * ThematicBreak represents a thematic break, such as a scene change in
 * a story, a transition to another topic, or a new document.
 *
 * @see https://github.com/syntax-tree/mdast#thematicbreak
 * @see https://github.github.com/gfm/#thematic-break
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#thematicbreak
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/thematic-break
 */
export class ThematicBreakMarkupWeaver implements INodeMarkupWeaver<ThematicBreak> {
  public readonly couldBeWrapped = false
  public readonly isBlockLevel = true

  public weave(): INodeMarkup | string {
    return '---'
  }
}
