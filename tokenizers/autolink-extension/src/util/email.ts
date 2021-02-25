import type { NodePoint } from '@yozora/character'
import type { ResultOfRequiredEater } from '@yozora/core-tokenizer'
import { AsciiCodePoint, isAlphanumeric } from '@yozora/character'

/**
 * An extended email autolink will be recognised when an email address is
 * recognised within any text node. Email addresses are recognised according to
 * the following rules:
 *
 *  - One ore more characters which are alphanumeric, or '.', '-', '_', or '+'.
 *  - An '@' symbol.
 *  - One or more characters which are alphanumeric, or '-' or '_', separated
 *    by periods (.). There must be at least one period. The last character must
 *    not be one of '-' or '_'.
 *
 * @see https://github.github.com/gfm/#extended-email-autolink
 */
export function eatExtendEmailAddress(
  nodePoints: ReadonlyArray<NodePoint>,
  startIndex: number,
  endIndex: number,
): ResultOfRequiredEater {
  let i = startIndex
  if (i >= endIndex || !isAlphanumeric(nodePoints[i].codePoint)) {
    return { valid: false, nextIndex: i + 1 }
  }

  for (i += 1; i < endIndex; i += 1) {
    const c = nodePoints[i].codePoint
    if (
      isAlphanumeric(c) ||
      c === AsciiCodePoint.DOT ||
      c === AsciiCodePoint.MINUS_SIGN ||
      c === AsciiCodePoint.UNDERSCORE ||
      c === AsciiCodePoint.PLUS_SIGN
    )
      continue
    break
  }

  // Match an '@' symbol.
  if (
    i === startIndex ||
    i + 2 >= endIndex ||
    nodePoints[i].codePoint !== AsciiCodePoint.AT_SIGN ||
    !isAlphanumeric(nodePoints[i + 1].codePoint)
  )
    return { valid: false, nextIndex: i + 1 }

  let countOfPeriod = 0
  for (i += 2; i < endIndex; i += 1) {
    const c = nodePoints[i].codePoint
    if (c === AsciiCodePoint.DOT) {
      countOfPeriod += 1
      continue
    }

    if (
      isAlphanumeric(c) ||
      c === AsciiCodePoint.MINUS_SIGN ||
      c === AsciiCodePoint.UNDERSCORE
    )
      continue
    break
  }

  // '.', '-', and '_' can occur on both sides of the '@', but only '.' may
  // occur at the end of the email address, in which case it will not be
  // considered part of the address.
  const lastCharacter = nodePoints[i - 1].codePoint
  if (
    lastCharacter === AsciiCodePoint.MINUS_SIGN ||
    lastCharacter === AsciiCodePoint.UNDERSCORE
  )
    return { valid: false, nextIndex: i }

  if (lastCharacter === AsciiCodePoint.DOT) {
    i -= 1
    countOfPeriod -= 1
  }

  // There must be at least one period.
  if (countOfPeriod <= 0) return { valid: false, nextIndex: i }
  return { valid: true, nextIndex: i }
}
