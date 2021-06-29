import type { NodePoint } from '@yozora/character'
import { AsciiCodePoint } from '@yozora/character'
import type { YastInlineToken } from '@yozora/core-tokenizer'

/**
 * The link text may contain balanced brackets, but not unbalanced ones,
 * unless they are escaped
 *
 * @see https://github.github.com/gfm/#example-520
 * @see https://github.github.com/gfm/#example-521
 * @see https://github.github.com/gfm/#example-522
 * @see https://github.github.com/gfm/#example-523
 */
export const checkBalancedBracketsStatus = (
  startIndex: number,
  endIndex: number,
  innerTokens: ReadonlyArray<YastInlineToken>,
  nodePoints: ReadonlyArray<NodePoint>,
): -1 | 0 | 1 => {
  let i = startIndex
  let bracketCount = 0

  // update bracketCount
  const updateBracketCount = (): void => {
    const c = nodePoints[i].codePoint
    switch (c) {
      case AsciiCodePoint.BACKSLASH:
        i += 1
        break
      case AsciiCodePoint.OPEN_BRACKET:
        bracketCount += 1
        break
      case AsciiCodePoint.CLOSE_BRACKET:
        bracketCount -= 1
        break
    }
  }

  for (const innerToken of innerTokens) {
    if (innerToken.startIndex < startIndex) continue
    if (innerToken.endIndex > endIndex) break
    for (; i < innerToken.startIndex; ++i) {
      updateBracketCount()
      if (bracketCount < 0) return -1
    }
    i = innerToken.endIndex
  }

  for (; i < endIndex; ++i) {
    updateBracketCount()
    if (bracketCount < 0) return -1
  }
  return bracketCount > 0 ? 1 : 0
}
