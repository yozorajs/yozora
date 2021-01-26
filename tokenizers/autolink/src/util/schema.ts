/**
 * A scheme is any sequence of 2–32 characters beginning with an ASCII letter
 * and followed by any combination of ASCII letters, digits, or the symbols
 * plus (`+`), period (`.`), or hyphen (`-`).
 * @see https://github.github.com/gfm/#scheme
 */


import type {
  EnhancedYastNodePoint,
  YastNodeInterval,
} from '@yozora/tokenizercore'
import { AsciiCodePoint, isAsciiDigit, isAsciiLetter } from '@yozora/character'


/**
 * Try to find to autolink schema strictly start from the give `startIndex`.
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 */
export function eatAutolinkSchema(
  nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  startIndex: number,
  endIndex: number,
): number | null {
  let i = startIndex
  const c = nodePoints[i].codePoint
  if (!isAsciiLetter(c)) return null

  for (i += 1; i < endIndex; ++i) {
    const d = nodePoints[i].codePoint
    if (
      isAsciiLetter(d) ||
      isAsciiDigit(d) ||
      d === AsciiCodePoint.PLUS_SIGN ||
      d === AsciiCodePoint.DOT ||
      d === AsciiCodePoint.MINUS_SIGN
    ) continue
    break
  }

  const count = i - startIndex
  if (count < 2 || count > 32) return null
  return i
}


/**
 * Try to found an autolink schema in the range [startIndex, endIndex).
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @see https://github.github.com/gfm/#scheme
 */
export function findAutolinkSchema(
  nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  startIndex: number,
  endIndex: number,
): YastNodeInterval | null {
  for (let i = startIndex; i < endIndex; ++i) {
    const c = nodePoints[i].codePoint
    if (!isAsciiLetter(c)) continue

    const schemaStartIndex = i
    for (i += 1; i < endIndex; ++i) {
      const d = nodePoints[i].codePoint
      if (
        isAsciiLetter(d) ||
        isAsciiDigit(d) ||
        d === AsciiCodePoint.PLUS_SIGN ||
        d === AsciiCodePoint.DOT ||
        d === AsciiCodePoint.MINUS_SIGN
      ) continue
      break
    }

    const count = i - schemaStartIndex
    if (count < 2 || count > 32) continue
    return { startIndex: schemaStartIndex, endIndex: i }
  }
  return null
}
