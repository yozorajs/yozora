import type {
  EnhancedYastNodePoint,
  RawHTMLAttribute,
  YastNodeInterval,
} from '@yozora/tokenizercore'
import type { InlineTokenDelimiter } from '@yozora/tokenizercore-inline'
import type { InlineHtml } from '../types'
import { AsciiCodePoint } from '@yozora/character'
import {
  eatHTMLAttribute,
  eatHTMLTagName,
  eatOptionalWhiteSpaces,
} from '@yozora/tokenizercore'


export const InlineHtmlOpenTagType = 'open'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type InlineHtmlOpenTagType = typeof InlineHtmlOpenTagType


/**
 * @see https://github.github.com/gfm/#open-tag
 */
export interface InlineHtmlOpenTag extends InlineHtml {
  tagType: InlineHtmlOpenTagType
  /**
   * HTML tag name.
   */
  tagName: string
  /**
   * HTML attributes.
   */
  attributes: { name: string, value?: string }[]
  /**
   * Whether if a html tag is self closed.
   */
  selfClosed: boolean
}


export interface InlineHtmlOpenMatchPhaseData {
  tagType: InlineHtmlOpenTagType
  tagName: YastNodeInterval
  attributes: RawHTMLAttribute[]
  selfClosed: boolean
}


export interface InlineHtmlOpenDelimiter extends InlineTokenDelimiter {
  type: InlineHtmlOpenTagType
  tagName: YastNodeInterval
  attributes: { name: YastNodeInterval, value?: YastNodeInterval }[]
  selfClosed: boolean
}


/**
 * Try to eating a HTML open tag delimiter.
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @see https://github.github.com/gfm/#open-tag
 */
export function eatInlineHtmlTokenOpenDelimiter(
  nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  startIndex: number,
  endIndex: number,
): InlineHtmlOpenDelimiter | null {
  let i = startIndex
  if (i + 2 >= endIndex) return null

  const tagNameStartIndex = i + 1
  const tagNameEndIndex = eatHTMLTagName(nodePoints, tagNameStartIndex, endIndex)
  if (tagNameEndIndex == null) return null

  const attributes: RawHTMLAttribute[] = []
  for (i = tagNameEndIndex; i < endIndex;) {
    const result = eatHTMLAttribute(nodePoints, i, endIndex)
    if (result == null) break
    attributes.push(result.attribute)
    i = result.nextIndex
  }

  i = eatOptionalWhiteSpaces(nodePoints, i, endIndex)
  if (i >= endIndex) return null

  let selfClosed = false
  if (nodePoints[i].codePoint === AsciiCodePoint.FORWARD_SLASH) {
    i += 1
    selfClosed = true
  }

  if (
    i >= endIndex ||
    nodePoints[i].codePoint !== AsciiCodePoint.CLOSE_ANGLE
  ) return null

  const delimiter: InlineHtmlOpenDelimiter = {
    type: InlineHtmlOpenTagType,
    startIndex,
    endIndex: i + 1,
    tagName: {
      startIndex: tagNameStartIndex,
      endIndex: tagNameEndIndex,
    },
    attributes,
    selfClosed
  }
  return delimiter
}
