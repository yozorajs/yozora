import type { Text } from '@yozora/ast'
import { BreakType, TextType } from '@yozora/ast'
import type { INodeMarkup, INodeMarkupWeaveContext, INodeWeaver } from '../types'
import { createCharacterEscaper } from '../util'

const literalBackslashRegex =
  /\\(?=$|\r\n?|\n|\t|[\u0021-\u002f\u003a-\u0040\u005b-\u0060\u007b-\u007e])/g
const escapeText = createCharacterEscaper(['*', '_', '`', '[', '!', '&', '$'])

/**
 * Text represents everything that is just text.
 *
 * @see https://github.com/syntax-tree/mdast#text
 * @see https://github.github.com/gfm/#textual-content
 * @see https://github.com/yozorajs/yozora/tree/v3/packages/ast#text
 * @see https://github.com/yozorajs/yozora/tree/v3/tokenizers/tokenizer-text
 */
export class TextWeaver implements INodeWeaver<Text> {
  public readonly type = TextType
  public readonly isBlockLevel = (): boolean => false

  public weave(node: Text, ctx: INodeMarkupWeaveContext, childIndex: number): INodeMarkup {
    const siblings = ctx.ancestors[ctx.ancestors.length - 1]?.children
    const hasLegacyLineEnding =
      siblings?.[childIndex] === node &&
      siblings[childIndex - 1]?.type === BreakType &&
      /^[\r\n]/.test(node.value)
    const value = hasLegacyLineEnding ? node.value.replace(/^(?:\r\n?|\n)/, '') : node.value

    // Markdown consumes these sequences as escapes or hard-break markers.
    const content = escapeText(value.replace(literalBackslashRegex, '\\\\'))
      .replace(/<(?=[!/?A-Za-z])/g, '\\<')
      .replace(/((?:^|\n)[ \t]*)([-+][ \t]+\S)/g, '$1\\$2')
      .replace(/((?:^|\n)[ \t]*\d{1,9})([.)])(?=[ \t])/g, '$1\\$2')
      // Entities protect email text and whitespace that backslashes cannot preserve.
      .replace(/@/g, '&#64;')
      .replace(/\t/g, '&#9;')
      .replace(/\r/g, '&#13;')
      .replace(/\n(?=[ \t]*\n)/g, '&#10;')
    // BreakWeaver leaves the legacy line ending to this Text node.
    return hasLegacyLineEnding ? { opener: '\n', content } : { content }
  }
}
