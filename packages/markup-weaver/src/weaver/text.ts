import type { Text } from '@yozora/ast'
import { LinkType, TextType } from '@yozora/ast'
import type { INodeMarkup, INodeMarkupWeaveContext, INodeWeaver } from '../types'

const linkBackslashRegex =
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

  public weave(node: Text, ctx: INodeMarkupWeaveContext): INodeMarkup {
    if (!ctx.ancestors.some(ancestor => ancestor.type === LinkType)) {
      return { content: node.value }
    }

    // Preserve literal backslashes before contextual escapers handle their following character.
    const content = node.value.replace(linkBackslashRegex, '\\\\')
    return { content }
  }
}
