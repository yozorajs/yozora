import type { NodePoint } from '@yozora/character'
import type { YastTokenDelimiter } from '@yozora/tokenizercore'
import { AsciiCodePoint } from '@yozora/character'


/**
*
 * @see https://github.github.com/gfm/#processing-instruction
 */
export interface HtmlInlineInstructionData {
  htmlType: 'instruction'
}


export interface HtmlInlineInstructionTokenData {
  htmlType: 'instruction'
}


export interface HtmlInlineInstructionDelimiter
  extends YastTokenDelimiter, HtmlInlineInstructionTokenData {
  type: 'full'
}


/**
 * A processing instruction consists of the string `<?`, a string of characters
 * not including the string `?>`, and the string `?>`.
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @see https://github.github.com/gfm/#processing-instruction
 */
export function eatHtmlInlineInstructionDelimiter(
  nodePoints: ReadonlyArray<NodePoint>,
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
        startIndex,
        endIndex: i + 2,
        htmlType: 'instruction',
      }
      return delimiter
    }
  }
  return null
}
