import { AsciiCodePoint } from '../../constant/ascii'
import { UnicodeZsCodePoint } from '../../constant/unicode/zs'
import {
  collectCodePointsFromEnum,
  createCodePointSearcher,
} from '../searcher'


/**
 * Determine if a character is a Unicode Whitespace Character
 *
 * A Unicode whitespace character is any code point in the Unicode Zs general
 * category, or a tab (U+0009), carriage return (U+000D), newline (U+000A),
 * or form feed (U+000C).
 * @see https://github.github.com/gfm/#unicode-whitespace-character
 * @see http://www.fileformat.info/info/unicode/category/Zs/list.htm
 */
export const [
  isUnicodeWhiteSpaceCharacter,
  unicodeWhiteSpaceCharacters,
] = createCodePointSearcher([
  AsciiCodePoint.HORIZONTAL_TAB,
  AsciiCodePoint.LINE_FEED,
  AsciiCodePoint.FORM_FEED,
  AsciiCodePoint.CARRIAGE_RETURN,
  ...collectCodePointsFromEnum(UnicodeZsCodePoint)
])
