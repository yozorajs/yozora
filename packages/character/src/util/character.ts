import { AsciiCodePoint } from '../constant/ascii'
import { UnicodePcCodePoint } from '../constant/unicode/pc'
import { UnicodePdCodePoint } from '../constant/unicode/pd'
import { UnicodePeCodePoint } from '../constant/unicode/pe'
import { UnicodePfCodePoint } from '../constant/unicode/pf'
import { UnicodePiCodePoint } from '../constant/unicode/pi'
import { UnicodePoCodePoint } from '../constant/unicode/po'
import { UnicodePsCodePoint } from '../constant/unicode/ps'
import { VirtualCodePoint } from '../constant/virtual'
import type { ICodePoint } from '../types'
import {
  asciiControlCharacters,
  asciiPunctuationCharacters,
  isAsciiControlCharacter,
} from './charset/ascii'
import { collectCodePointsFromEnum, createCodePointSearcher } from './searcher'

/**
 * Determine if a character is a ASCII Whitespace Character
 *
 * A whitespace character is a space (U+0020), tab (U+0009), newline (U+000A),
 * line tabulation (U+000B), form feed (U+000C), or carriage return (U+000D)
 * @see https://github.github.com/gfm/#whitespace-character
 */
export const [isWhitespaceCharacter, whitespaceCharacters] = createCodePointSearcher([
  AsciiCodePoint.VT,
  AsciiCodePoint.FF,
  AsciiCodePoint.SPACE,
  VirtualCodePoint.SPACE,
  VirtualCodePoint.LINE_END,
])

/**
 * Determine if a character is a space
 *
 * A space is U+0020
 * @see https://github.github.com/gfm/#space
 */
export const spaceCharacters = [AsciiCodePoint.SPACE, VirtualCodePoint.SPACE]
export const isSpaceCharacter = (codePoint: ICodePoint): boolean => {
  return codePoint === AsciiCodePoint.SPACE || codePoint === VirtualCodePoint.SPACE
}

/**
 * Determine if a character is a line end.
 * @see https://github.github.com/gfm/#line-ending
 */
export const isLineEnding = (codePoint: ICodePoint): boolean => {
  return codePoint === VirtualCodePoint.LINE_END
}

/**
 * Determine if a character is a Punctuation Character
 *
 * A punctuation character is an ASCII punctuation character or anything in the
 * general Unicode categories Pc, Pd, Pe, Pf, Pi, Po, or Ps.
 * @see https://github.github.com/gfm/#punctuation-character
 */
export const [isPunctuationCharacter, punctuationCharacters] = createCodePointSearcher([
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
export const controlCharacters = asciiControlCharacters
export const isControlCharacter = isAsciiControlCharacter

/**
 * Line endings are treated like spaces
 * @see https://github.github.com/gfm/#example-345
 * @see https://github.github.com/gfm/#example-346
 */
export const isSpaceLike = (c: ICodePoint): boolean => isSpaceCharacter(c) || isLineEnding(c)
