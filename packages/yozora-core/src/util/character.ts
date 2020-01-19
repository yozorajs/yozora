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


/**
 * ASCII control characters are characters encoded between the
 * range [0x00,0x1F] and [0x7F, 0x7F]
 * @param c
 */
export function isASCIIControlCharacter(c: CharCode): boolean {
  return (c >= 0x00 && c <= 0x1F) || c === 0x7F
}
