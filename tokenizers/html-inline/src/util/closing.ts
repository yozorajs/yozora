import type { NodeInterval, NodePoint } from '@yozora/character'
import type { InlineTokenDelimiter } from '@yozora/tokenizercore-inline'
import type { HtmlInline } from '../types'
import { AsciiCodePoint } from '@yozora/character'
import { eatHTMLTagName, eatOptionalWhitespaces } from '@yozora/tokenizercore'


export const HtmlInlineClosingTagType = 'closing'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type HtmlInlineClosingTagType = typeof HtmlInlineClosingTagType


/**
 * @see https://github.github.com/gfm/#closing-tag
 */
export interface HtmlInlineClosingTag extends HtmlInline {
  tagType: HtmlInlineClosingTagType
  /**
   * HTML tag name.
   */
  tagName: string
}


export interface HtmlInlineClosingMatchPhaseStateData {
  tagType: HtmlInlineClosingTagType
  tagName: NodeInterval
}


export interface HtmlInlineClosingDelimiter
  extends InlineTokenDelimiter, HtmlInlineClosingMatchPhaseStateData {
  type: 'full'
}


/**
 * Try to eating a HTML closing tag delimiter.
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
    tagType: HtmlInlineClosingTagType,
    startIndex,
    endIndex: i + 1,
    tagName: {
      startIndex: tagNameStartIndex,
      endIndex: tagNameEndIndex,
    }
  }
  return delimiter
}
