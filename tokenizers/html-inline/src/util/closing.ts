import type { NodeInterval, NodePoint } from '@yozora/character'
import type { InlineTokenDelimiter } from '@yozora/tokenizercore-inline'
import { AsciiCodePoint } from '@yozora/character'
import { eatHTMLTagName, eatOptionalWhitespaces } from '@yozora/tokenizercore'


export interface HtmlInlineClosingTagData {
  htmlType: 'closing'
  tagName: string
}


export interface HtmlInlineClosingMatchPhaseStateData {
  htmlType: 'closing'
  tagName: NodeInterval
}


export interface HtmlInlineClosingDelimiter
  extends InlineTokenDelimiter, HtmlInlineClosingMatchPhaseStateData {
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
  if (
    i + 3 >= endIndex ||
    nodePoints[i + 1].codePoint !== AsciiCodePoint.SLASH
  ) return null

  const tagNameStartIndex = i + 2
  const tagNameEndIndex = eatHTMLTagName(nodePoints, tagNameStartIndex, endIndex)
  if (tagNameEndIndex == null) return null

  i = eatOptionalWhitespaces(nodePoints, tagNameEndIndex, endIndex)
  if (
    i >= endIndex ||
    nodePoints[i].codePoint !== AsciiCodePoint.CLOSE_ANGLE
  ) return null

  const delimiter: HtmlInlineClosingDelimiter = {
    type: 'full',
    startIndex,
    endIndex: i + 1,
    htmlType: 'closing',
    tagName: {
      startIndex: tagNameStartIndex,
      endIndex: tagNameEndIndex,
    }
  }
  return delimiter
}
