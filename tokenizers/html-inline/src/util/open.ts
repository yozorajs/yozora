import type { NodePoint } from '@yozora/character'
import type { RawHTMLAttribute, YastNodeInterval } from '@yozora/tokenizercore'
import type { InlineTokenDelimiter } from '@yozora/tokenizercore-inline'
import type { HtmlInline } from '../types'
import { AsciiCodePoint } from '@yozora/character'
import {
  eatHTMLAttribute,
  eatHTMLTagName,
  eatOptionalWhitespaces,
} from '@yozora/tokenizercore'


export const HtmlInlineOpenTagType = 'open'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type HtmlInlineOpenTagType = typeof HtmlInlineOpenTagType


/**
 * @see https://github.github.com/gfm/#open-tag
 */
export interface HtmlInlineOpenTag extends HtmlInline {
  tagType: HtmlInlineOpenTagType
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


export interface HtmlInlineOpenMatchPhaseData {
  tagType: HtmlInlineOpenTagType
  tagName: YastNodeInterval
  attributes: RawHTMLAttribute[]
  selfClosed: boolean
}


export interface HtmlInlineOpenDelimiter
  extends InlineTokenDelimiter, HtmlInlineOpenMatchPhaseData {
  type: 'full'
}


/**
 * Try to eating a HTML open tag delimiter.
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @see https://github.github.com/gfm/#open-tag
 */
export function eatHtmlInlineTokenOpenDelimiter(
  nodePoints: ReadonlyArray<NodePoint>,
  startIndex: number,
  endIndex: number,
): HtmlInlineOpenDelimiter | null {
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

  i = eatOptionalWhitespaces(nodePoints, i, endIndex)
  if (i >= endIndex) return null

  let selfClosed = false
  if (nodePoints[i].codePoint === AsciiCodePoint.SLASH) {
    i += 1
    selfClosed = true
  }

  if (
    i >= endIndex ||
    nodePoints[i].codePoint !== AsciiCodePoint.CLOSE_ANGLE
  ) return null

  const delimiter: HtmlInlineOpenDelimiter = {
    type: 'full',
    tagType: HtmlInlineOpenTagType,
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
