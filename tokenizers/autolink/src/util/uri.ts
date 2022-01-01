import type { INodePoint } from '@yozora/character'
import {
  AsciiCodePoint,
  isAlphanumeric,
  isAsciiCharacter,
  isAsciiControlCharacter,
  isAsciiLetter,
  isWhitespaceCharacter,
} from '@yozora/character'
import type { IResultOfRequiredEater } from '@yozora/core-tokenizer'

/**
 * Try to find to autolink absolute uri strictly start from the give `startIndex`.
 *
 * An absolute URI, for these purposes, consists of a scheme followed by a
 * colon (:) followed by zero or more characters other than ASCII whitespace
 * and control characters, `<`, and `>`. If the URI includes these characters,
 * they must be percent-encoded (e.g. %20 for a space).
 *
 * @see https://github.github.com/gfm/#absolute-uri
 */
export function eatAbsoluteUri(
  nodePoints: ReadonlyArray<INodePoint>,
  startIndex: number,
  endIndex: number,
): IResultOfRequiredEater {
  const schema = eatAutolinkSchema(nodePoints, startIndex, endIndex)
  let { nextIndex } = schema

  if (
    !schema.valid ||
    nextIndex >= endIndex ||
    nodePoints[nextIndex].codePoint !== AsciiCodePoint.COLON
  )
    return { valid: false, nextIndex }

  for (nextIndex += 1; nextIndex < endIndex; ++nextIndex) {
    const c = nodePoints[nextIndex].codePoint
    if (
      !isAsciiCharacter(c) ||
      isWhitespaceCharacter(c) ||
      isAsciiControlCharacter(c) ||
      c === AsciiCodePoint.OPEN_ANGLE ||
      c === AsciiCodePoint.CLOSE_ANGLE
    )
      break
  }
  return { valid: true, nextIndex }
}

/**
 * Try to find to autolink schema strictly start from the give `startIndex`.
 *
 * A scheme is any sequence of 2–32 characters beginning with an ASCII letter
 * and followed by any combination of ASCII letters, digits, or the symbols
 * plus (`+`), period (`.`), or hyphen (`-`).
 *
 * @see https://github.github.com/gfm/#scheme
 */
export function eatAutolinkSchema(
  nodePoints: ReadonlyArray<INodePoint>,
  startIndex: number,
  endIndex: number,
): IResultOfRequiredEater {
  let i = startIndex
  const c = nodePoints[i].codePoint
  if (!isAsciiLetter(c)) return { valid: false, nextIndex: i + 1 }

  for (i += 1; i < endIndex; ++i) {
    const d = nodePoints[i].codePoint
    if (
      isAlphanumeric(d) ||
      d === AsciiCodePoint.PLUS_SIGN ||
      d === AsciiCodePoint.DOT ||
      d === AsciiCodePoint.MINUS_SIGN
    )
      continue
    break
  }

  const count = i - startIndex
  if (count < 2 || count > 32) return { valid: false, nextIndex: i + 1 }
  return { valid: true, nextIndex: i }
}
