import type { Text } from '@yozora/ast'
import type { IEscape, INodeMarkup, INodeMarkupWeaver } from '../types'

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
  public readonly escape: IEscape = content =>
    content
      .replace(/\\/g, '\\\\')
      .replace(/\n([>])/g, '\n    $1')
      .replace(/\n([-*]+(?:[ \t]+\S))/g, '\n    $1')

  public weave(node: Text): INodeMarkup | string {
    return node.value
  }
}
