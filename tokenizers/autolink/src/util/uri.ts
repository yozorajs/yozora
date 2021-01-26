/**
 * An absolute URI, for these purposes, consists of a scheme followed by a
 * colon (:) followed by zero or more characters other than ASCII whitespace
 * and control characters, `<`, and `>`. If the URI includes these characters,
 * they must be percent-encoded (e.g. %20 for a space).
 *
 * @see https://github.github.com/gfm/#absolute-uri
 */


import type {
  EnhancedYastNodePoint,
  YastNodeInterval,
} from '@yozora/tokenizercore'
import {
  AsciiCodePoint,
  isAsciiCharacter,
  isAsciiControlCharacter,
  isAsciiWhiteSpaceCharacter,
} from '@yozora/character'
import { eatAutolinkSchema, findAutolinkSchema } from './schema'


/**
 * Try to find to autolink absolute uri strictly start from the give `startIndex`.
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 */
export function eatAutolinkAbsoluteURI(
  nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  startIndex: number,
  endIndex: number,
): number | null {
  let i = eatAutolinkSchema(nodePoints, startIndex, endIndex)
  if (
    i == null ||
    nodePoints[i].codePoint !== AsciiCodePoint.COLON
  ) return null

  for (i += 1; i < endIndex; ++i) {
    const c = nodePoints[i].codePoint
    if (
      !isAsciiCharacter(c) ||
      isAsciiWhiteSpaceCharacter(c) ||
      isAsciiControlCharacter(c) ||
      c === AsciiCodePoint.OPEN_ANGLE ||
      c === AsciiCodePoint.CLOSE_ANGLE
    ) break
  }
  return i
}


/**
 * Try to found an autolink absolute uri in the range [startIndex, endIndex).
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 */
export function findAutolinkAbsoluteURI(
  nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  startIndex: number,
  endIndex: number,
): YastNodeInterval | null {
  for (let i = startIndex; i < endIndex; ++i) {
    const schemaInterval = findAutolinkSchema(nodePoints, startIndex, endIndex)
    if (schemaInterval == null) return null

    let i = schemaInterval.endIndex
    if (i >= endIndex) return null

    // Try to resolve at the next position.
    if (nodePoints[i].codePoint !== AsciiCodePoint.COLON) continue

    for (i += 1; i < endIndex; ++i) {
      const c = nodePoints[i].codePoint
      if (
        !isAsciiCharacter(c) ||
        isAsciiWhiteSpaceCharacter(c) ||
        isAsciiControlCharacter(c) ||
        c === AsciiCodePoint.OPEN_ANGLE ||
        c === AsciiCodePoint.CLOSE_ANGLE
      ) break
    }

    return { startIndex: schemaInterval.startIndex, endIndex: i }
  }
  return null
}
