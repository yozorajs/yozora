import { AsciiCodePoint } from '../../constant/ascii'
import type { CodePoint } from '../../types'
import { createCodePointSearcher } from '../searcher'

/**
 * Determine if a character is a ASCII Whitespace Character
 *
 * A whitespace character is a space (U+0020), tab (U+0009), newline (U+000A),
 * line tabulation (U+000B), form feed (U+000C), or carriage return (U+000D)
 * @see https://github.github.com/gfm/#whitespace-character
 */
export const [isAsciiWhitespaceCharacter, asciiWhitespaceCharacters] =
  createCodePointSearcher([
    AsciiCodePoint.HT,
    AsciiCodePoint.LF,
    AsciiCodePoint.VT,
    AsciiCodePoint.FF,
    AsciiCodePoint.CR,
    AsciiCodePoint.SPACE,
  ])

/**
 * Determine if a character is a ASCII Punctuation Character
 *
 * An ASCII punctuation character is
 *  - '!', '"', '#', '$', '%', '&', '\'', '(', ')', '*', '+', ',', '-', '.', '/' (U+0021–002F),
 *  - ':', ';', '<', '=', '>', '?', '@' (U+003A–0040),
 *  - '[', '\\', ']', '^', '_', '`' (U+005B–0060),
 *  - '{', '|', '}', or '~' (U+007B–007E).
 * @see https://github.github.com/gfm/#ascii-punctuation-character
 */
export const [isAsciiPunctuationCharacter, asciiPunctuationCharacters] =
  createCodePointSearcher([
    /**
     * U+0021 - U+002F
     * '!', '"', '#', '$', '%', '&', '\'', '(', ')', '*', '+', ',', '-', '.', '/'
     */
    AsciiCodePoint.EXCLAMATION_MARK,
    AsciiCodePoint.DOUBLE_QUOTE,
    AsciiCodePoint.NUMBER_SIGN,
    AsciiCodePoint.DOLLAR_SIGN,
    AsciiCodePoint.PERCENT_SIGN,
    AsciiCodePoint.AMPERSAND,
    AsciiCodePoint.SINGLE_QUOTE,
    AsciiCodePoint.OPEN_PARENTHESIS,
    AsciiCodePoint.CLOSE_PARENTHESIS,
    AsciiCodePoint.ASTERISK,
    AsciiCodePoint.PLUS_SIGN,
    AsciiCodePoint.COMMA,
    AsciiCodePoint.MINUS_SIGN,
    AsciiCodePoint.DOT,
    AsciiCodePoint.SLASH,

    /**
     * U+003A - U+0040
     * ':', ';', '<', '=', '>', '?', '@'
     */
    AsciiCodePoint.COLON,
    AsciiCodePoint.SEMICOLON,
    AsciiCodePoint.OPEN_ANGLE,
    AsciiCodePoint.EQUALS_SIGN,
    AsciiCodePoint.CLOSE_ANGLE,
    AsciiCodePoint.QUESTION_MARK,
    AsciiCodePoint.AT_SIGN,

    /**
     * U+005B – U+0060
     * '[', '\\', ']', '^', '_', '`'
     */
    AsciiCodePoint.OPEN_BRACKET,
    AsciiCodePoint.BACKSLASH,
    AsciiCodePoint.CLOSE_BRACKET,
    AsciiCodePoint.CARET,
    AsciiCodePoint.UNDERSCORE,
    AsciiCodePoint.BACKTICK,

    /**
     * U+007B – U+007E
     * '{', '|', '}', '~'
     */
    AsciiCodePoint.OPEN_BRACE,
    AsciiCodePoint.VERTICAL_SLASH,
    AsciiCodePoint.CLOSE_BRACE,
    AsciiCodePoint.TILDE,
  ])

/**
 * Test if a code point is an ascii number character.
 */
export const isAsciiDigitCharacter = (codePoint: CodePoint): boolean =>
  codePoint >= AsciiCodePoint.DIGIT0 && codePoint <= AsciiCodePoint.DIGIT9

/**
 * Test if a code point is an ascii lowercase letter.
 *
 * @param codePoint
 */
export const isAsciiLowerLetter = (codePoint: CodePoint): boolean =>
  codePoint >= AsciiCodePoint.LOWERCASE_A &&
  codePoint <= AsciiCodePoint.LOWERCASE_Z

/**
 * Test if a code point is an ascii uppercase letter.
 *
 * @param codePoint
 */
export const isAsciiUpperLetter = (codePoint: CodePoint): boolean =>
  codePoint >= AsciiCodePoint.UPPERCASE_A &&
  codePoint <= AsciiCodePoint.UPPERCASE_Z

/**
 * Test if a code point is an ascii letter.
 *
 * @param codePoint
 */
export const isAsciiLetter = (codePoint: CodePoint): boolean =>
  isAsciiLowerLetter(codePoint) || isAsciiUpperLetter(codePoint)

/**
 * Test if a code point is an alphanumeric character.
 *
 * @param codePoint
 */
export const isAlphanumeric = (codePoint: CodePoint): boolean =>
  isAsciiLowerLetter(codePoint) ||
  isAsciiUpperLetter(codePoint) ||
  isAsciiDigitCharacter(codePoint)

/**
 * Test if a code point is an ascii character.
 *
 * @param codePoint
 */
export const isAsciiCharacter = (codePoint: CodePoint): boolean =>
  codePoint >= AsciiCodePoint.NUL && codePoint <= AsciiCodePoint.DELETE

/**
 * ASCII control characters are characters encoded between the
 * range [0x00,0x1F] and [0x7F, 0x7F]
 */
export const [isAsciiControlCharacter, asciiControlCharacters] =
  createCodePointSearcher([
    AsciiCodePoint.NUL,
    AsciiCodePoint.SOH,
    AsciiCodePoint.STX,
    AsciiCodePoint.ETX,
    AsciiCodePoint.EOT,
    AsciiCodePoint.ENQ,
    AsciiCodePoint.ACK,
    AsciiCodePoint.BEL,
    AsciiCodePoint.BS,
    AsciiCodePoint.HT,
    AsciiCodePoint.LF,
    AsciiCodePoint.VT,
    AsciiCodePoint.FF,
    AsciiCodePoint.CR,
    AsciiCodePoint.SO,
    AsciiCodePoint.SI,
    AsciiCodePoint.DLE,
    AsciiCodePoint.DC1,
    AsciiCodePoint.DC2,
    AsciiCodePoint.DC3,
    AsciiCodePoint.DC4,
    AsciiCodePoint.NAK,
    AsciiCodePoint.SYN,
    AsciiCodePoint.ETB,
    AsciiCodePoint.CAN,
    AsciiCodePoint.EM,
    AsciiCodePoint.SUB,
    AsciiCodePoint.ESC,
    AsciiCodePoint.FS,
    AsciiCodePoint.GS,
    AsciiCodePoint.RS,
    AsciiCodePoint.US,
    AsciiCodePoint.DELETE,
  ])
