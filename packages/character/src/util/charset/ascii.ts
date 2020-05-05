import { AsciiCodePoint } from '../../constant/ascii'
import { createCodePointSearcher } from '../searcher'


/**
 * Determine if a character is a ASCII Whitespace Character
 *
 * A whitespace character is a space (U+0020), tab (U+0009), newline (U+000A),
 * line tabulation (U+000B), form feed (U+000C), or carriage return (U+000D)
 * @see https://github.github.com/gfm/#whitespace-character
 */
export const [
  isAsciiWhiteSpaceCharacter,
  asciiWhiteSpaceCharacters,
] = createCodePointSearcher([
  AsciiCodePoint.HORIZONTAL_TAB,
  AsciiCodePoint.LINE_FEED,
  AsciiCodePoint.VERTICAL_TAB,
  AsciiCodePoint.FORM_FEED,
  AsciiCodePoint.CARRIAGE_RETURN,
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
export const [
  isAsciiPunctuationCharacter,
  asciiPunctuationCharacters,
] = createCodePointSearcher([
  /**
   * U+0021 - U+002F
   * '!', '"', '#', '$', '%', '&', '\'', '(', ')', '*', '+', ',', '-', '.', '/'
   */
  AsciiCodePoint.EXCLAMATION_MARK,
  AsciiCodePoint.DOUBLE_QUOTE,
  AsciiCodePoint.NUMBER_SIGN,
  AsciiCodePoint.DOLLAR,
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
  AsciiCodePoint.FORWARD_SLASH,

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
  AsciiCodePoint.BACK_SLASH,
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
 * ASCII number characters are characters encoded between the
 * range [0x31, 0x39]
 */
export const [
  isAsciiNumberCharacter,
  asciiNumberCharacters,
] = createCodePointSearcher([
  AsciiCodePoint.NUMBER_ONE,
  AsciiCodePoint.NUMBER_TWO,
  AsciiCodePoint.NUMBER_THREE,
  AsciiCodePoint.NUMBER_FOUR,
  AsciiCodePoint.NUMBER_FIVE,
  AsciiCodePoint.NUMBER_SIX,
  AsciiCodePoint.NUMBER_SEVEN,
  AsciiCodePoint.NUMBER_EIGHT,
  AsciiCodePoint.NUMBER_NINE,
])


/**
 * ASCII control characters are characters encoded between the
 * range [0x00,0x1F] and [0x7F, 0x7F]
 */
export const [
  isAsciiControlCharacter,
  asciiControlCharacters,
] = createCodePointSearcher([
  AsciiCodePoint.NULL,
  AsciiCodePoint.START_OF_HEADER,
  AsciiCodePoint.START_OF_TEXT,
  AsciiCodePoint.END_OF_TEXT,
  AsciiCodePoint.END_OF_TRANSMISSION,
  AsciiCodePoint.ENQUIRY,
  AsciiCodePoint.ACKNOWLEDGEMENT,
  AsciiCodePoint.BELL,
  AsciiCodePoint.BACKSPACE,
  AsciiCodePoint.HORIZONTAL_TAB,
  AsciiCodePoint.LINE_FEED,
  AsciiCodePoint.VERTICAL_TAB,
  AsciiCodePoint.FORM_FEED,
  AsciiCodePoint.CARRIAGE_RETURN,
  AsciiCodePoint.SHIFT_OUT,
  AsciiCodePoint.SHIFT_IN,
  AsciiCodePoint.DATA_LINK_ESCAPE,
  AsciiCodePoint.DEVICE_CONTROL_1,
  AsciiCodePoint.DEVICE_CONTROL_2,
  AsciiCodePoint.DEVICE_CONTROL_3,
  AsciiCodePoint.DEVICE_CONTROL_4,
  AsciiCodePoint.NEGATIVE_ACKNOWLEDGEMENT,
  AsciiCodePoint.SYNCHRONOUS_IDLE,
  AsciiCodePoint.END_OF_TRANS_THE_BLOCK,
  AsciiCodePoint.CANCEL,
  AsciiCodePoint.END_OF_MEDIUM,
  AsciiCodePoint.SUBSTITUTE,
  AsciiCodePoint.ESCAPE,
  AsciiCodePoint.FILE_SEPARATOR,
  AsciiCodePoint.GROUP_SEPARATOR,
  AsciiCodePoint.RECORD_SEPARATOR,
  AsciiCodePoint.UNIT_SEPARATOR,
  AsciiCodePoint.DELETE,
])
