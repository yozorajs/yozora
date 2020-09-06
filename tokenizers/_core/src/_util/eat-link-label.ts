// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../types/fold-case.d.ts" />
import foldCase from 'fold-case'
import {
  AsciiCodePoint,
  isUnicodeWhiteSpaceCharacter,
} from '@yozora/character'
import { DataNodeTokenPointDetail } from '../_types/token'


/**
 * A link label begins with a left bracket '[' and ends with the first right bracket ']'
 * that is not backslash-escaped. Between these brackets there must be at least one
 * non-whitespace character. Unescaped square bracket characters are not allowed inside
 * the opening and closing square brackets of link labels. A link label can have at most
 * 999 characters inside the square brackets.
 *
 * One label matches another just in case their normalized forms are equal. To normalize
 * a label, strip off the opening and closing brackets, perform the Unicode case fold,
 * strip leading and trailing whitespace and collapse consecutive internal whitespace to
 * a single space. If there are multiple matching reference link definitions, the one that
 * comes first in the document is used. (It is desirable in such cases to emit a warning.)
 * @see https://github.github.com/gfm/#link-label
 * @return position at next iteration
 */
export function eatLinkLabel(
  codePositions: DataNodeTokenPointDetail[],
  startIndex: number,
  endIndex: number,
): number {
  let i = startIndex, hasNonWhiteSpaceCharacter = false, t = 0
  if (
    i + 1 >= endIndex ||
    codePositions[i].codePoint !== AsciiCodePoint.OPEN_BRACKET
  ) {
    return -1
  }

  const updateHasNonWhiteSpaceCharacter = (k: number): void => {
    if (hasNonWhiteSpaceCharacter || k >= endIndex) return
    const c = codePositions[k]
    hasNonWhiteSpaceCharacter = !isUnicodeWhiteSpaceCharacter(c.codePoint)
  }

  for (i += 1; i < endIndex && t < 999; i += 1, t += 1) {
    const c = codePositions[i]
    switch (c.codePoint) {
      case AsciiCodePoint.BACK_SLASH:
        i += 1
        updateHasNonWhiteSpaceCharacter(i)
        break
      case AsciiCodePoint.OPEN_BRACKET:
        return -1
      case AsciiCodePoint.CLOSE_BRACKET:
        /**
         * A link label must contain at least one non-whitespace character
         *
         * @see https://github.github.com/gfm/#example-559
         * @see https://github.github.com/gfm/#example-560
         */
        if (i === startIndex || hasNonWhiteSpaceCharacter) return i + 1
        return -1
      default:
        updateHasNonWhiteSpaceCharacter(i)
    }
  }
  return -1
}


/**
 * One label matches another just in case their normalized forms are equal.
 * To normalize a label, strip off the opening and closing brackets, perform
 * the Unicode case fold, strip leading and trailing whitespace and collapse
 * consecutive internal whitespace to a single space. If there are multiple
 * matching reference link definitions, the one that comes first in the
 * document is used. (It is desirable in such cases to emit a warning.)
 * @see https://github.github.com/gfm/#link-label
 */
export function resolveLabelToIdentifier(label: string): string {
  return foldCase(
    label
      .trim()
      .replace(/\s+/, ' ')
      .toLowerCase()
  )
}
