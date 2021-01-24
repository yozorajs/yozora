import type {
  EnhancedYastNodePoint,
  YastLiteral,
  YastNodeInterval,
} from '@yozora/tokenizercore'
import type { InlineTokenDelimiter } from '@yozora/tokenizercore-inline'
import type { InlineHtml } from '../types'
import { AsciiCodePoint } from '@yozora/character'


export const InlineHtmlInstructionTagType = 'instruction'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type InlineHtmlInstructionTagType = typeof InlineHtmlInstructionTagType


/**
 * A processing instruction consists of the string `<?`, a string of characters
 * not including the string `?>`, and the string `?>`.
 *
 * @see https://github.github.com/gfm/#processing-instruction
 */
export interface InlineHtmlInstruction extends InlineHtml, YastLiteral {
  tagType: InlineHtmlInstructionTagType
}


export interface InlineHtmlInstructionMatchPhaseStateData {
  tagType: InlineHtmlInstructionTagType
  startIndex: number
  endIndex: number
}


export interface InlineHtmlInstructionDelimiter extends InlineTokenDelimiter {
  type: InlineHtmlInstructionTagType
  contents: YastNodeInterval
}


/**
 * Try to eating a processing instruction delimiter.
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @see https://github.github.com/gfm/#processing-instruction
 */
export function eatInlineHtmlInstructionDelimiter(
  nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  startIndex: number,
  endIndex: number,
): InlineHtmlInstructionDelimiter | null {
  let i = startIndex
  if (
    i + 3 >= endIndex ||
    nodePoints[i + 1].codePoint !== AsciiCodePoint.QUESTION_MARK
  ) return null

  const si = i + 2
  for (i = si; i < endIndex; ++i) {
    const p = nodePoints[i]
    if (p.codePoint !== AsciiCodePoint.QUESTION_MARK) continue
    if (i + 1 >= endIndex) return null
    if (nodePoints[i + 1].codePoint === AsciiCodePoint.CLOSE_ANGLE) {
      const delimiter: InlineHtmlInstructionDelimiter = {
        type: InlineHtmlInstructionTagType,
        startIndex,
        endIndex: i + 2,
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
