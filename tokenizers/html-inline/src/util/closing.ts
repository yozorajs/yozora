import type { NodeInterval, NodePoint } from '@yozora/character'
import { AsciiCodePoint } from '@yozora/character'
import type { YastTokenDelimiter } from '@yozora/core-tokenizer'
import { eatOptionalWhitespaces } from '@yozora/core-tokenizer'
import { eatHTMLTagName } from '@yozora/tokenizer-html-block'

export interface HtmlInlineClosingTagData {
  htmlType: 'closing'
  tagName: string
}

export interface HtmlInlineClosingTokenData {
  htmlType: 'closing'
  tagName: NodeInterval
}

export interface HtmlInlineClosingDelimiter
  extends YastTokenDelimiter,
    HtmlInlineClosingTokenData {
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
  nodePoints: ReadonlyArray<NodePoint>,
  startIndex: number,
  endIndex: number,
): HtmlInlineClosingDelimiter | null {
  let i = startIndex
  if (i + 3 >= endIndex || nodePoints[i + 1].codePoint !== AsciiCodePoint.SLASH)
    return null

  const tagNameStartIndex = i + 2
  const tagNameEndIndex = eatHTMLTagName(
    nodePoints,
    tagNameStartIndex,
    endIndex,
  )
  if (tagNameEndIndex == null) return null

  i = eatOptionalWhitespaces(nodePoints, tagNameEndIndex, endIndex)
  if (i >= endIndex || nodePoints[i].codePoint !== AsciiCodePoint.CLOSE_ANGLE)
    return null

  const delimiter: HtmlInlineClosingDelimiter = {
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
