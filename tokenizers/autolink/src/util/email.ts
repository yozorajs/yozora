import type { INodePoint } from '@yozora/character'
import {
  AsciiCodePoint,
  isAlphanumeric,
  isAsciiDigitCharacter,
  isAsciiLetter,
} from '@yozora/character'
import type {
  IResultOfOptionalEater,
  IResultOfRequiredEater,
} from '@yozora/core-tokenizer'

/**
 * An email address, for these purposes, is anything that matches the
 * non-normative regex from the HTML5 spec:
 *
 *  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}
 *   [a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
 *
 * @see https://github.github.com/gfm/#email-address
 */
export function eatEmailAddress(
  nodePoints: ReadonlyArray<INodePoint>,
  startIndex: number,
  endIndex: number,
): IResultOfRequiredEater {
  let i = startIndex

  // Match /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+/
  for (; i < endIndex; i += 1) {
    const c = nodePoints[i].codePoint
    if (isAsciiLetter(c) || isAsciiDigitCharacter(c)) continue
    if (
      c !== AsciiCodePoint.DOT &&
      c !== AsciiCodePoint.EXCLAMATION_MARK &&
      c !== AsciiCodePoint.NUMBER_SIGN &&
      c !== AsciiCodePoint.DOLLAR_SIGN &&
      c !== AsciiCodePoint.PERCENT_SIGN &&
      c !== AsciiCodePoint.AMPERSAND &&
      c !== AsciiCodePoint.SINGLE_QUOTE &&
      c !== AsciiCodePoint.ASTERISK &&
      c !== AsciiCodePoint.PLUS_SIGN &&
      c !== AsciiCodePoint.SLASH &&
      c !== AsciiCodePoint.EQUALS_SIGN &&
      c !== AsciiCodePoint.QUESTION_MARK &&
      c !== AsciiCodePoint.CARET &&
      c !== AsciiCodePoint.UNDERSCORE &&
      c !== AsciiCodePoint.BACKTICK &&
      c !== AsciiCodePoint.OPEN_BRACE &&
      c !== AsciiCodePoint.VERTICAL_SLASH &&
      c !== AsciiCodePoint.CLOSE_BRACE &&
      c !== AsciiCodePoint.TILDE &&
      c !== AsciiCodePoint.MINUS_SIGN
    )
      break
  }

  if (
    i === startIndex ||
    i + 1 >= endIndex ||
    nodePoints[i].codePoint !== AsciiCodePoint.AT_SIGN ||
    !isAlphanumeric(nodePoints[i + 1].codePoint)
  )
    return { valid: false, nextIndex: i + 1 }

  i = eatAddressPart0(nodePoints, i + 2, endIndex)

  // Match /(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*/
  for (; i + 1 < endIndex; ) {
    let c = nodePoints[i].codePoint
    if (c !== AsciiCodePoint.DOT) break

    c = nodePoints[i + 1].codePoint
    if (!isAsciiLetter(c) && !isAsciiDigitCharacter(c)) break
    i = eatAddressPart0(nodePoints, i + 2, endIndex)
  }

  return { valid: true, nextIndex: i }
}

/**
 * Match regex /(?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?/
 *
 */
function eatAddressPart0(
  nodePoints: ReadonlyArray<INodePoint>,
  startIndex: number,
  endIndex: number,
): IResultOfOptionalEater {
  let i = startIndex,
    result = -1

  for (let _endIndex = Math.min(endIndex, i + 62); i < _endIndex; ++i) {
    const c = nodePoints[i].codePoint
    if (isAsciiLetter(c) || isAsciiDigitCharacter(c)) {
      result = i
      continue
    }
    if (c !== AsciiCodePoint.MINUS_SIGN) break
  }
  return result >= startIndex ? result + 1 : startIndex
}
