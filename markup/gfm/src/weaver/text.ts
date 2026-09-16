import type { Text } from '@yozora/ast'
import { TextType } from '@yozora/ast'
import type { INodeMarkup, INodeMarkupWeaveContext, INodeWeaver } from '../types'

const literalBackslashRegex =
  /\\(?=$|\r\n?|\n|[\u0021-\u002f\u003a-\u0040\u005b-\u0060\u007b-\u007e])/g

/**
 * Text represents everything that is just text.
 *
 * @see https://github.com/syntax-tree/mdast#text
 * @see https://github.github.com/gfm/#textual-content
 * @see https://github.com/yozorajs/yozora/tree/release-2.x.x/packages/ast#text
 * @see https://github.com/yozorajs/yozora/tree/release-2.x.x/tokenizers/text
 */
export class TextWeaver implements INodeWeaver<Text> {
  public readonly type = TextType
  public readonly isBlockLevel = (): boolean => false

  public weave(node: Text, _ctx: INodeMarkupWeaveContext): INodeMarkup {
    if (!node.value.includes('\\')) return { content: node.value }

    // Markdown consumes these sequences as escapes or hard-break markers.
    const content = node.value.replace(literalBackslashRegex, '\\\\')
    return { content }
  }
}
