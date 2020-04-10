import {
  CodePoint,
  DataNodeTokenPointDetail,
  isUnicodeWhiteSpace,
} from '@yozora/tokenizer-core'
export { eatLinkText } from '@yozora/tokenizer-link'
import { ReferenceLinkDataNodeMatchState } from './tokenizer'


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
  codePoints: DataNodeTokenPointDetail[],
  state: ReferenceLinkDataNodeMatchState,
  startIndex: number,
  endIndex: number,
): number {
  let hasNonWhiteSpaceCharacter = false, c = 0
  for (let i = startIndex; i < endIndex && c < 999; ++i, ++c) {
    const p = codePoints[i]
    if (!hasNonWhiteSpaceCharacter) hasNonWhiteSpaceCharacter = !isUnicodeWhiteSpace(p.codePoint)
    switch (p.codePoint) {
      case CodePoint.BACK_SLASH:
        ++i
        break
      case CodePoint.OPEN_BRACKET:
        return -1
      case CodePoint.CLOSE_BRACKET:
        if (i === startIndex || hasNonWhiteSpaceCharacter) return i
        return -1
    }
  }
  return -1
}
