import type { INodeInterval, INodePoint } from '@yozora/character'
import { AsciiCodePoint } from '@yozora/character'
import type { ITokenDelimiter } from '@yozora/core-tokenizer'
import { eatOptionalWhitespaces } from '@yozora/core-tokenizer'
import { eatHTMLTagName } from '@yozora/tokenizer-html-block'

export interface IHtmlInlineClosingTagData {
  htmlType: 'closing'
  tagName: string
}

export interface IHtmlInlineClosingTokenData {
  htmlType: 'closing'
  tagName: INodeInterval
}

export interface IHtmlInlineClosingDelimiter extends ITokenDelimiter, IHtmlInlineClosingTokenData {
  type: 'full'
}

/**
 * A closing tag consists of the string '</', a tag name, optional whitespace,
 * and the character '>'.
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @see https://github.github.com/gfm/#closing-tag
 */
export function eatHtmlInlineClosingDelimiter(
  nodePoints: readonly INodePoint[],
  startIndex: number,
  endIndex: number,
): IHtmlInlineClosingDelimiter | null {
  let i = startIndex
  if (i + 3 >= endIndex || nodePoints[i + 1].codePoint !== AsciiCodePoint.SLASH) return null

  const tagNameStartIndex = i + 2
  const tagNameEndIndex = eatHTMLTagName(nodePoints, tagNameStartIndex, endIndex)
  if (tagNameEndIndex == null) return null

  i = eatOptionalWhitespaces(nodePoints, tagNameEndIndex, endIndex)
  if (i >= endIndex || nodePoints[i].codePoint !== AsciiCodePoint.CLOSE_ANGLE) return null

  const delimiter: IHtmlInlineClosingDelimiter = {
    type: 'full',
    startIndex,
    endIndex: i + 1,
    htmlType: 'closing',
    tagName: {
      startIndex: tagNameStartIndex,
      endIndex: tagNameEndIndex,
    },
  }
  return delimiter
}
