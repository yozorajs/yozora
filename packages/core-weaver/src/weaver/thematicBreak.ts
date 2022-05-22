import type { List, ThematicBreak } from '@yozora/ast'
import { ListItemType, ThematicBreakType } from '@yozora/ast'
import type { INodeMarkup, INodeMarkupWeaveContext, INodeMarkupWeaver } from '../types'

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
  public readonly type = ThematicBreakType
  public readonly isBlockLevel = (): boolean => true

  public weave(_node: ThematicBreak, ctx: INodeMarkupWeaveContext): INodeMarkup {
    const { ancestors } = ctx
    if (ancestors.length >= 2) {
      const parent = ancestors[ancestors.length - 1]
      if (parent.type === ListItemType) {
        const gradeParent = ancestors[ancestors.length - 2] as List
        switch (String.fromCodePoint(gradeParent.marker)) {
          case '*':
            return { opener: '---' }
          case '-':
            return { opener: '****' }
        }
      }
    }
    return { opener: '---' }
  }
}
