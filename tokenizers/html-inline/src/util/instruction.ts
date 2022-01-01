import type { INodePoint } from '@yozora/character'
import { AsciiCodePoint } from '@yozora/character'
import type { IYastTokenDelimiter } from '@yozora/core-tokenizer'

/**
 *
 * @see https://github.github.com/gfm/#processing-instruction
 */
export interface IHtmlInlineInstructionData {
  htmlType: 'instruction'
}

export interface IHtmlInlineInstructionTokenData {
  htmlType: 'instruction'
}

export interface IHtmlInlineInstructionDelimiter
  extends IYastTokenDelimiter,
    IHtmlInlineInstructionTokenData {
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
  nodePoints: ReadonlyArray<INodePoint>,
  startIndex: number,
  endIndex: number,
): IHtmlInlineInstructionDelimiter | null {
  let i = startIndex
  if (
    i + 3 >= endIndex ||
    nodePoints[i + 1].codePoint !== AsciiCodePoint.QUESTION_MARK
  )
    return null

  const si = i + 2
  for (i = si; i < endIndex; ++i) {
    const p = nodePoints[i]
    if (p.codePoint !== AsciiCodePoint.QUESTION_MARK) continue
    if (i + 1 >= endIndex) return null
    if (nodePoints[i + 1].codePoint === AsciiCodePoint.CLOSE_ANGLE) {
      const delimiter: IHtmlInlineInstructionDelimiter = {
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
