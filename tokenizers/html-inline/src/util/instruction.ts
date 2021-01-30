import type {
  EnhancedYastNodePoint,
  YastLiteral,
  YastNodeInterval,
} from '@yozora/tokenizercore'
import type { InlineTokenDelimiter } from '@yozora/tokenizercore-inline'
import type { HtmlInline } from '../types'
import { AsciiCodePoint } from '@yozora/character'


export const HtmlInlineInstructionTagType = 'instruction'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type HtmlInlineInstructionTagType = typeof HtmlInlineInstructionTagType


/**
 * A processing instruction consists of the string `<?`, a string of characters
 * not including the string `?>`, and the string `?>`.
 *
 * @see https://github.github.com/gfm/#processing-instruction
 */
export interface HtmlInlineInstruction extends HtmlInline, YastLiteral {
  tagType: HtmlInlineInstructionTagType
}


export interface HtmlInlineInstructionMatchPhaseStateData {
  tagType: HtmlInlineInstructionTagType
  content: YastNodeInterval
}


export interface HtmlInlineInstructionDelimiter
  extends InlineTokenDelimiter, HtmlInlineInstructionMatchPhaseStateData {
  type: 'full'
}


/**
 * Try to eating a processing instruction delimiter.
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @see https://github.github.com/gfm/#processing-instruction
 */
export function eatHtmlInlineInstructionDelimiter(
  nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  startIndex: number,
  endIndex: number,
): HtmlInlineInstructionDelimiter | null {
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
      const delimiter: HtmlInlineInstructionDelimiter = {
        type: 'full',
        tagType: HtmlInlineInstructionTagType,
        startIndex,
        endIndex: i + 2,
        content: {
          startIndex: si,
          endIndex: i,
        }
      }
      return delimiter
    }
  }
  return null
}
