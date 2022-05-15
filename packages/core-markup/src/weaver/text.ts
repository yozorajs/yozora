import type { Text } from '@yozora/ast'
import type { IEscaper, INodeMarkup, INodeMarkupWeaver } from '../types'

const _escapeContent: IEscaper = content =>
  content
    .replace(/(^|\n)([>])/g, '$1\\$2') // for blockquote
    .replace(/(^|\n)([#]{1,6}[ \t]+\S)/g, '$1\\$2') // for heading
    .replace(/([ \t])([#]+(?:\n|$))/g, '$1\\$2') // for heading
    .replace(/(\n)([-*+][ \t]+\S)/g, '$1\\$2') // for list
    .replace(/(\n)([-_*])([ \t]*\2[ \t]*\2(?:[ \t]|\2)*(?:\n|$))/g, '$1\\$2$3') // for thematicBreak

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
  public readonly escapeContent: IEscaper = _escapeContent

  public weave(node: Text): INodeMarkup {
    return { content: node.value }
  }
}
