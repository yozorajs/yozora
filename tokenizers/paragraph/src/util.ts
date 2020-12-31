import type { DataNodeTokenPointDetail } from '@yozora/tokenizercore'
import type { PhrasingContentLine } from '@yozora/tokenizercore-block'
import { isWhiteSpaceCharacter } from '@yozora/character'


/**
 * Merge list of PhrasingContentLine to a DataNodeTokenPointDetail list
 * @param lines
 */
export function mergeContentLines(
  lines: PhrasingContentLine[]
): DataNodeTokenPointDetail[] {
  const contents: DataNodeTokenPointDetail[] = []

  for (let i = 0; i + 1 < lines.length; ++i) {
    const line = lines[i]
    const { firstNonWhiteSpaceIndex, codePositions } = line
    const endIndex = codePositions.length

    /**
     * Leading spaces are skipped
     * @see https://github.github.com/gfm/#example-192
     */
    for (let i = firstNonWhiteSpaceIndex; i < endIndex; ++i) {
      contents.push(codePositions[i])
    }
  }

  /**
   * Final spaces are stripped before inline parsing, so a phrasingContent that
   * ends with two or more spaces will not end with a hard line break
   * @see https://github.github.com/gfm/#example-196
   */
  if (lines.length > 0) {
    const line = lines[lines.length - 1]
    const { firstNonWhiteSpaceIndex, codePositions } = line

    let lastNonWhiteSpaceIndex = codePositions.length - 1
    for (; lastNonWhiteSpaceIndex >= 0; --lastNonWhiteSpaceIndex) {
      const c = codePositions[lastNonWhiteSpaceIndex]
      if (!isWhiteSpaceCharacter(c.codePoint)) break
    }
    for (let i = firstNonWhiteSpaceIndex; i <= lastNonWhiteSpaceIndex; ++i) {
      contents.push(codePositions[i])
    }
  }

  return contents
}
