import type { CodePoint } from '../types'
import { AsciiCodePoint } from '../constant/ascii'
import { UnicodePcCodePoint } from '../constant/unicode/pc'
import { UnicodePdCodePoint } from '../constant/unicode/pd'
import { UnicodePeCodePoint } from '../constant/unicode/pe'
import { UnicodePfCodePoint } from '../constant/unicode/pf'
import { UnicodePiCodePoint } from '../constant/unicode/pi'
import { UnicodePoCodePoint } from '../constant/unicode/po'
import { UnicodePsCodePoint } from '../constant/unicode/ps'
import {
  asciiControlCharacters,
  asciiPunctuationCharacters,
  asciiWhiteSpaceCharacters,
  isAsciiControlCharacter,
  isAsciiWhiteSpaceCharacter,
} from './charset/ascii'
import { collectCodePointsFromEnum, createCodePointSearcher } from './searcher'


/**
 * Determine if a character is a ASCII Whitespace Character
 *
 * A whitespace character is a space (U+0020), tab (U+0009), newline (U+000A),
 * line tabulation (U+000B), form feed (U+000C), or carriage return (U+000D)
 * @see https://github.github.com/gfm/#whitespace-character
 */
export const isWhiteSpaceCharacter = isAsciiWhiteSpaceCharacter
export const whitespaceCharacters = asciiWhiteSpaceCharacters


/**
 * Determine if a character is a space
 *
 * A space is U+0020
 * @see https://github.github.com/gfm/#space
 */
export const isSpaceCharacter = (codePoint: CodePoint): boolean => {
  return codePoint === AsciiCodePoint.SPACE
}
export const spaceCharacters = [AsciiCodePoint.SPACE]


/**
 * Determine if a character is a Punctuation Character
 *
 * A punctuation character is an ASCII punctuation character or anything in the
 * general Unicode categories Pc, Pd, Pe, Pf, Pi, Po, or Ps.
 * @see https://github.github.com/gfm/#punctuation-character
 */
export const [
  isPunctuationCharacter,
  punctuationCharacters,
] = createCodePointSearcher([
  ...asciiPunctuationCharacters,
  ...collectCodePointsFromEnum(UnicodePcCodePoint),
  ...collectCodePointsFromEnum(UnicodePdCodePoint),
  ...collectCodePointsFromEnum(UnicodePeCodePoint),
  ...collectCodePointsFromEnum(UnicodePfCodePoint),
  ...collectCodePointsFromEnum(UnicodePiCodePoint),
  ...collectCodePointsFromEnum(UnicodePoCodePoint),
  ...collectCodePointsFromEnum(UnicodePsCodePoint),
])


/**
 * Determine if a character is a Control Character
 */
export const isControlCharacter = isAsciiControlCharacter
export const controlCharacters = asciiControlCharacters
