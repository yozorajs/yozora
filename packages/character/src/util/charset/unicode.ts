import { AsciiCodePoint } from '../../constant/ascii'
import { UnicodeZsCodePoint } from '../../constant/unicode/zs'
import { VirtualCodePoint } from '../../constant/virtual'
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
  isUnicodeWhitespaceCharacter,
  unicodeWhitespaceCharacters,
] = createCodePointSearcher([
  AsciiCodePoint.HT,
  AsciiCodePoint.LF,
  AsciiCodePoint.FF,
  AsciiCodePoint.CR,
  VirtualCodePoint.SPACE,
  VirtualCodePoint.LINE_END,
  ...collectCodePointsFromEnum(UnicodeZsCodePoint)
])
