import type { EnhancedYastNodePoint } from '@yozora/tokenizercore'
import type { PhrasingContentLine } from './types/tokenizer'
import { isWhiteSpaceCharacter } from '@yozora/character'


/**
 * Merge list of PhrasingContentLine to a EnhancedYastNodePoint list
 * @param lines
 */
export function mergeContentLines(
  lines: PhrasingContentLine[]
): EnhancedYastNodePoint[] {
  const contents: EnhancedYastNodePoint[] = []

  for (let i = 0; i + 1 < lines.length; ++i) {
    const line = lines[i]
    const { firstNonWhiteSpaceIndex, nodePoints } = line
    const endIndex = nodePoints.length

    /**
     * Leading spaces are skipped
     * @see https://github.github.com/gfm/#example-192
     */
    for (let i = firstNonWhiteSpaceIndex; i < endIndex; ++i) {
      contents.push(nodePoints[i])
    }
  }

  /**
   * Final spaces are stripped before inline parsing, so a phrasingContent that
   * ends with two or more spaces will not end with a hard line break
   * @see https://github.github.com/gfm/#example-196
   */
  if (lines.length > 0) {
    const line = lines[lines.length - 1]
    const { firstNonWhiteSpaceIndex, nodePoints } = line

    let lastNonWhiteSpaceIndex = nodePoints.length - 1
    for (; lastNonWhiteSpaceIndex >= 0; --lastNonWhiteSpaceIndex) {
      const c = nodePoints[lastNonWhiteSpaceIndex]
      if (!isWhiteSpaceCharacter(c.codePoint)) break
    }
    for (let i = firstNonWhiteSpaceIndex; i <= lastNonWhiteSpaceIndex; ++i) {
      contents.push(nodePoints[i])
    }
  }

  return contents
}
