import type {
  EnhancedYastNodePoint,
  YastLiteral,
  YastNodeInterval,
} from '@yozora/tokenizercore'
import type { InlineTokenDelimiter } from '@yozora/tokenizercore-inline'
import { AsciiCodePoint } from '@yozora/character'
import { HtmlInline } from '../types'


export const HtmlInlineCDataTagType = 'cdata'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type HtmlInlineCDataTagType = typeof HtmlInlineCDataTagType


/**
 * A CDATA section consists of the string `<![CDATA[`, a string of characters not
 * including the string `]]>`, and the string `]]>`.
 *
 * @see https://github.github.com/gfm/#cdata-section
 */
export interface HtmlInlineCData extends HtmlInline, YastLiteral {
  tagType: HtmlInlineCDataTagType
}


export interface HtmlInlineCDataMatchPhaseStateData {
  tagType: HtmlInlineCDataTagType
  startIndex: number
  endIndex: number
}


export interface HtmlInlineCDataDelimiter extends InlineTokenDelimiter {
  type: HtmlInlineCDataTagType
  contents: YastNodeInterval
}


/**
 * Try to eating a CDATA section delimiter.
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @see https://github.github.com/gfm/#cdata-section
 */
export function eatHtmlInlineCDataDelimiter(
  nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  startIndex: number,
  endIndex: number,
): HtmlInlineCDataDelimiter | null {
  let i = startIndex
  if (
    i + 11 >= endIndex ||
    nodePoints[i + 1].codePoint !== AsciiCodePoint.EXCLAMATION_MARK ||
    nodePoints[i + 2].codePoint !== AsciiCodePoint.OPEN_BRACKET ||
    nodePoints[i + 3].codePoint !== AsciiCodePoint.UPPERCASE_C ||
    nodePoints[i + 4].codePoint !== AsciiCodePoint.UPPERCASE_D ||
    nodePoints[i + 5].codePoint !== AsciiCodePoint.UPPERCASE_A ||
    nodePoints[i + 6].codePoint !== AsciiCodePoint.UPPERCASE_T ||
    nodePoints[i + 7].codePoint !== AsciiCodePoint.UPPERCASE_A ||
    nodePoints[i + 8].codePoint !== AsciiCodePoint.OPEN_BRACKET
  ) return null

  const si = i + 9
  for (i = si; i < endIndex; ++i) {
    const p = nodePoints[i]
    if (p.codePoint !== AsciiCodePoint.CLOSE_BRACKET) continue
    if (i + 2 >= endIndex) return null
    if (
      nodePoints[i + 1].codePoint === AsciiCodePoint.CLOSE_BRACKET &&
      nodePoints[i + 2].codePoint === AsciiCodePoint.CLOSE_ANGLE
    ) {
      const delimiter: HtmlInlineCDataDelimiter = {
        type: HtmlInlineCDataTagType,
        startIndex,
        endIndex: i + 3,
        contents: {
          startIndex: si,
          endIndex: i,
        }
      }
      return delimiter
    }
  }
  return null
}
