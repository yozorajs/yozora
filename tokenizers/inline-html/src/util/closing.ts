import type {
  EnhancedYastNodePoint,
  YastNodeInterval,
} from '@yozora/tokenizercore'
import type { InlineTokenDelimiter } from '@yozora/tokenizercore-inline'
import type { InlineHtml } from '../types'
import { AsciiCodePoint } from '@yozora/character'
import { eatOptionalWhiteSpaces } from '@yozora/tokenizercore'
import { eatHtmlTagName } from './open'


export const InlineHtmlClosingTagType = 'closing'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type InlineHtmlClosingTagType = typeof InlineHtmlClosingTagType


/**
 * @see https://github.github.com/gfm/#closing-tag
 */
export interface InlineHtmlClosingTag extends InlineHtml {
  tagType: InlineHtmlClosingTagType
  /**
   * HTML tag name.
   */
  tagName: string
}


export interface InlineHtmlClosingMatchPhaseStateData {
  tagType: InlineHtmlClosingTagType
  tagName: YastNodeInterval
}


export interface InlineHtmlClosingDelimiter extends InlineTokenDelimiter {
  type: InlineHtmlClosingTagType
  tagName: YastNodeInterval
}


/**
 * Try to eating a HTML closing tag delimiter.
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @see https://github.github.com/gfm/#closing-tag
 */
export function eatInlineHtmlClosingDelimiter(
  nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  startIndex: number,
  endIndex: number,
): InlineHtmlClosingDelimiter | null {
  let i = startIndex
  if (
    i + 3 >= endIndex ||
    nodePoints[i + 1].codePoint !== AsciiCodePoint.FORWARD_SLASH
  ) return null

  const tagNameStartIndex = i + 2
  const tagNameEndIndex = eatHtmlTagName(nodePoints, tagNameStartIndex, endIndex)
  if (tagNameEndIndex == null) return null

  i = eatOptionalWhiteSpaces(nodePoints, tagNameEndIndex, endIndex)
  if (
    i >= endIndex ||
    nodePoints[i].codePoint !== AsciiCodePoint.CLOSE_ANGLE
  ) return null

  const delimiter: InlineHtmlClosingDelimiter = {
    type: InlineHtmlClosingTagType,
    startIndex,
    endIndex: i + 1,
    tagName: {
      startIndex: tagNameStartIndex,
      endIndex: tagNameEndIndex,
    }
  }
  return delimiter
}
