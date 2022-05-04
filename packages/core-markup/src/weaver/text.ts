import type { Text } from '@yozora/ast'
import type { INodeMarkup, INodeMarkupWeaver } from '../types'

/**
 * Text represents everything that is just text.
 *
 * @see https://github.com/syntax-tree/mdast#text
 * @see https://github.github.com/gfm/#textual-content
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#text
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/text
 */
export class TextMarkupWeaver implements INodeMarkupWeaver<Text> {
  public readonly couldBeWrapped = true
  public readonly isBlockLevel = false

  public weave(node: Text): INodeMarkup | string {
    return node.value
  }
}
