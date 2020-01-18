import { CharCode } from '../constant/character'


/**
 * Determine if a character is a Whitespace Character
 * @param c
 * @see https://github.github.com/gfm/#whitespace-character
 */
export function isWhiteSpace(c: CharCode): boolean {
  switch (c) {
    case CharCode.TAB:
    case CharCode.LINE_FEED:
    case CharCode.LINE_TABULATION:
    case CharCode.FORM_FEED:
    case CharCode.CARRIAGE_RETURN:
    case CharCode.SPACE:
      return true
    default:
      return false
  }
}
