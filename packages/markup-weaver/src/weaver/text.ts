import type { Text } from '@yozora/ast'
import { TextType } from '@yozora/ast'
import type { INodeMarkup, INodeWeaver } from '../types'

/**
 * Text represents everything that is just text.
 *
 * @see https://github.com/syntax-tree/mdast#text
 * @see https://github.github.com/gfm/#textual-content
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#text
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/text
 */
export class TextWeaver implements INodeWeaver<Text> {
  public readonly type = TextType
  public readonly isBlockLevel = (): boolean => false

  public weave(node: Text): INodeMarkup {
    return { content: node.value }
  }
}
