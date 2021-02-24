/**
 * ASCII code point.
 */
export enum AsciiCodePoint {
  /**
   * Control character: '\0'
   */
  NUL = 0x0000,
  /**
   * Control character: start of header
   */
  SOH = 0x0001,
  /**
   * Control character: start of text
   */
  STX = 0x0002,
  /**
   * Control character: end of text
   */
  ETX = 0x0003,
  /**
   * Control character: end of transmission
   */
  EOT = 0x0004,
  /**
   * Control character: enquiry
   */
  ENQ = 0x0005,
  /**
   * Control character: acknowledgement
   */
  ACK = 0x0006,
  /**
   * Control character: bell
   */
  BEL = 0x0007,
  /**
   * Control character: backspace
   */
  BS = 0x0008,
  /**
   * Control character: horizontal tab
   */
  HT = 0x0009,
  /**
   * Control character: line feed
   */
  LF = 0x000a,
  /**
   * Control character: vertical tab
   */
  VT = 0x000b,
  /**
   * Control character: form feed
   */
  FF = 0x000c,
  /**
   * Control character: carriage return
   */
  CR = 0x000d,
  /**
   * Control character: shift out
   */
  SO = 0x000e,
  /**
   * Control character: shift in
   */
  SI = 0x000f,
  /**
   * Control character: data link escape
   */
  DLE = 0x0010,
  /**
   * Control character: device control 1
   */
  DC1 = 0x0011,
  /**
   * Control character: device control 2
   */
  DC2 = 0x0012,
  /**
   * Control character: device control 3
   */
  DC3 = 0x0013,
  /**
   * Control character: device control 4
   */
  DC4 = 0x0014,
  /**
   * Control character: negative acknowledgement
   */
  NAK = 0x0015,
  /**
   * Control character: synchronous idle
   */
  SYN = 0x0016,
  /**
   * Control character: end of trans the block
   */
  ETB = 0x0017,
  /**
   * Control character: cancel
   */
  CAN = 0x0018,
  /**
   * Control character: end of medium
   */
  EM = 0x0019,
  /**
   * Control character: substitute
   */
  SUB = 0x001a,
  /**
   * Control character: esc
   */
  ESC = 0x001b,
  /**
   * Control character: file separator
   */
  FS = 0x001c,
  /**
   * Control character: group separator
   */
  GS = 0x001d,
  /**
   * Control character: record separator
   */
  RS = 0x001e,
  /**
   * Control character: unit separator
   */
  US = 0x001f,
  /**
   * Space: ' '
   */
  SPACE = 0x0020,
  /**
   * Exclamation mark: '!'
   */
  EXCLAMATION_MARK = 0x0021,
  /**
   * Double quote / Quotation mark: '"'
   */
  DOUBLE_QUOTE = 0x0022,
  /**
   * Number sign: '#'
   */
  NUMBER_SIGN = 0x0023,
  /**
   * Dollar sign: '$'
   */
  DOLLAR_SIGN = 0x0024,
  /**
   * Percent sign: '%'
   */
  PERCENT_SIGN = 0x0025,
  /**
   * Ampersand: '&'
   */
  AMPERSAND = 0x0026,
  /**
   * Single quote / Apostrophe: '\''
   */
  SINGLE_QUOTE = 0x0027,
  /**
   * Left parenthesis: '('
   */
  OPEN_PARENTHESIS = 0x0028,
  /**
   * Right parenthesis: ')'
   */
  CLOSE_PARENTHESIS = 0x0029,
  /**
   * Asterisk: '*'
   */
  ASTERISK = 0x002a,
  /**
   * Plus sign: '+'
   */
  PLUS_SIGN = 0x002b,
  /**
   * Comma: ','
   */
  COMMA = 0x002c,
  /**
   * Minus sign / Hyphen / Dash: '-'
   */
  MINUS_SIGN = 0x002d,
  /**
   * Dot: '.'
   */
  DOT = 0x002e,
  /**
   * Forward slash: '/'
   */
  SLASH = 0x002f,
  /**
   * Digit zero: '0'
   */
  DIGIT0 = 0x0030,
  /**
   * Digit one: '1'
   */
  DIGIT1 = 0x0031,
  /**
   * Digit two: '2'
   */
  DIGIT2 = 0x0032,
  /**
   * Digit three: '3'
   */
  DIGIT3 = 0x0033,
  /**
   * Digit four: '4'
   */
  DIGIT4 = 0x0034,
  /**
   * Digit five: '5'
   */
  DIGIT5 = 0x0035,
  /**
   * Digit six: '6'
   */
  DIGIT6 = 0x0036,
  /**
   * Digit seven: '7'
   */
  DIGIT7 = 0x0037,
  /**
   * Digit eight: '8'
   */
  DIGIT8 = 0x0038,
  /**
   * Digit nine: '9'
   */
  DIGIT9 = 0x0039,
  /**
   * Colon: ':'
   */
  COLON = 0x003a,
  /**
   * semicolon: ';'
   */
  SEMICOLON = 0x003b,
  /**
   * Left angle / Less than: '<'
   */
  OPEN_ANGLE = 0x003c,
  /**
   * Equals than: '='
   */
  EQUALS_SIGN = 0x003d,
  /**
   * Right angle / Greater than: '>'
   */
  CLOSE_ANGLE = 0x003e,
  /**
   * Question mark: '?'
   */
  QUESTION_MARK = 0x003f,
  /**
   * At sign: '@'
   */
  AT_SIGN = 0x0040,
  /**
   * Uppercase letter 'A'
   */
  UPPERCASE_A = 0x0041,
  /**
   * Uppercase letter 'B'
   */
  UPPERCASE_B = 0x0042,
  /**
   * Uppercase letter 'C'
   */
  UPPERCASE_C = 0x0043,
  /**
   * Uppercase letter 'D'
   */
  UPPERCASE_D = 0x0044,
  /**
   * Uppercase letter 'E'
   */
  UPPERCASE_E = 0x0045,
  /**
   * Uppercase letter 'F'
   */
  UPPERCASE_F = 0x0046,
  /**
   * Uppercase letter 'G'
   */
  UPPERCASE_G = 0x0047,
  /**
   * Uppercase letter 'H'
   */
  UPPERCASE_H = 0x0048,
  /**
   * Uppercase letter 'I'
   */
  UPPERCASE_I = 0x0049,
  /**
   * Uppercase letter 'J'
   */
  UPPERCASE_J = 0x004a,
  /**
   * Uppercase letter 'K'
   */
  UPPERCASE_K = 0x004b,
  /**
   * Uppercase letter 'L'
   */
  UPPERCASE_L = 0x004c,
  /**
   * Uppercase letter 'M'
   */
  UPPERCASE_M = 0x004d,
  /**
   * Uppercase letter 'N'
   */
  UPPERCASE_N = 0x004e,
  /**
   * Uppercase letter 'O'
   */
  UPPERCASE_O = 0x004f,
  /**
   * Uppercase letter 'P'
   */
  UPPERCASE_P = 0x0050,
  /**
   * Uppercase letter 'Q'
   */
  UPPERCASE_Q = 0x0051,
  /**
   * Uppercase letter 'R'
   */
  UPPERCASE_R = 0x0052,
  /**
   * Uppercase letter 'S'
   */
  UPPERCASE_S = 0x0053,
  /**
   * Uppercase letter 'T'
   */
  UPPERCASE_T = 0x0054,
  /**
   * Uppercase letter 'U'
   */
  UPPERCASE_U = 0x0055,
  /**
   * Uppercase letter 'V'
   */
  UPPERCASE_V = 0x0056,
  /**
   * Uppercase letter 'W'
   */
  UPPERCASE_W = 0x0057,
  /**
   * Uppercase letter 'X'
   */
  UPPERCASE_X = 0x0058,
  /**
   * Uppercase letter 'Y'
   */
  UPPERCASE_Y = 0x0059,
  /**
   * Uppercase letter 'Z'
   */
  UPPERCASE_Z = 0x005a,
  /**
   * Left square bracket: '['
   */
  OPEN_BRACKET = 0x005b,
  /**
   * Backslash: '\\'
   */
  BACKSLASH = 0x005c,
  /**
   * Right square bracket: ']'
   */
  CLOSE_BRACKET = 0x005d,
  /**
   * Caret: '^'
   */
  CARET = 0x005e,
  /**
   * Underscore: '_'
   */
  UNDERSCORE = 0x005f,
  /**
   * Backtick / Grave accent: '`'
   */
  BACKTICK = 0x0060,
  /**
   * Lowercase letter 'a'
   */
  LOWERCASE_A = 0x0061,
  /**
   * Lowercase letter 'b'
   */
  LOWERCASE_B = 0x0062,
  /**
   * Lowercase letter 'c'
   */
  LOWERCASE_C = 0x0063,
  /**
   * Lowercase letter 'd'
   */
  LOWERCASE_D = 0x0064,
  /**
   * Lowercase letter 'e'
   */
  LOWERCASE_E = 0x0065,
  /**
   * Lowercase letter 'f'
   */
  LOWERCASE_F = 0x0066,
  /**
   * Lowercase letter 'g'
   */
  LOWERCASE_G = 0x0067,
  /**
   * Lowercase letter 'h'
   */
  LOWERCASE_H = 0x0068,
  /**
   * Lowercase letter 'i'
   */
  LOWERCASE_I = 0x0069,
  /**
   * Lowercase letter 'j'
   */
  LOWERCASE_J = 0x006a,
  /**
   * Lowercase letter 'k'
   */
  LOWERCASE_K = 0x006b,
  /**
   * Lowercase letter 'l'
   */
  LOWERCASE_L = 0x006c,
  /**
   * Lowercase letter 'm'
   */
  LOWERCASE_M = 0x006d,
  /**
   * Lowercase letter 'n'
   */
  LOWERCASE_N = 0x006e,
  /**
   * Lowercase letter 'o'
   */
  LOWERCASE_O = 0x006f,
  /**
   * Lowercase letter 'p'
   */
  LOWERCASE_P = 0x0070,
  /**
   * Lowercase letter 'q'
   */
  LOWERCASE_Q = 0x0071,
  /**
   * Lowercase letter 'r'
   */
  LOWERCASE_R = 0x0072,
  /**
   * Lowercase letter 's'
   */
  LOWERCASE_S = 0x0073,
  /**
   * Lowercase letter 't'
   */
  LOWERCASE_T = 0x0074,
  /**
   * Lowercase letter 'u'
   */
  LOWERCASE_U = 0x0075,
  /**
   * Lowercase letter 'v'
   */
  LOWERCASE_V = 0x0076,
  /**
   * Lowercase letter 'w'
   */
  LOWERCASE_W = 0x0077,
  /**
   * Lowercase letter 'x'
   */
  LOWERCASE_X = 0x0078,
  /**
   * Lowercase letter 'y'
   */
  LOWERCASE_Y = 0x0079,
  /**
   * Lowercase letter 'z'
   */
  LOWERCASE_Z = 0x007a,
  /**
   * Left curly brace: '{'
   */
  OPEN_BRACE = 0x007b,
  /**
   * Vertical bar: '|'
   */
  VERTICAL_SLASH = 0x007c,
  /**
   * Right curly brace: '}'
   */
  CLOSE_BRACE = 0x007d,
  /**
   * Tilde: `~`
   */
  TILDE = 0x007e,
  /**
   * Control character: delete
   */
  DELETE = 0x007f,
}
