import type { Text } from '@yozora/ast'
import type { IEscaper, INodeMarkup, INodeMarkupWeaver } from '../types'

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
  public readonly escapeContent: IEscaper = content =>
    content
      .replace(/\\/g, '\\\\')
      // .replace(/([*_])/g, '\\$1')
      .replace(/(^|\n)([>])/g, '$1\\$2')
      .replace(/([ \t])([#]+(?:\n|$))/g, '$1\\$2')
      .replace(/(^|\n)([#]{1,6}[ \t]+\S)/g, '$1\\$2')
      .replace(/(^|\n)([-*][ \t]+\S)/g, '$1\\$2')

  public weave(node: Text): INodeMarkup | string {
    return node.value
  }
}
