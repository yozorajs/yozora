/**
 * 字符编码
 */
export enum CodePoint {
  /**
   * 制表符 '\t'
   */
  TAB = 9,
  /**
   * 换行符 '\n'
   */
  LINE_FEED = 10,
  /**
   * 线制表符
   */
  LINE_TABULATION = 11,
  /**
   * 换页符
   */
  FORM_FEED = 12,
  /**
   * 回车 '\r'
   */
  CARRIAGE_RETURN = 13,
  /**
   * 空白符 ' '
   */
  SPACE = 32,
  /**
   * 惊叹号 '!'
   */
	EXCLAMATION_MARK = 33,
  /**
   * 双引号 '"'
   */
  DOUBLE_QUOTE = 34,
  /**
   * 美元符号 '$'
   */
  DOLLAR = 36,
  /**
   * 单引号 '\''
   */
  SINGLE_QUOTE = 39,
  /**
   * 左圆括号 '('
   */
  OPEN_PARENTHESIS = 40,
  /**
   * 右圆括号 ')'
   */
  CLOSE_PARENTHESIS = 41,
  /**
   * 星号 '*'
   */
  ASTERISK = 42,
  /**
   * 加号 '+'
   */
  PLUS_SIGN = 43,
  /**
   * 连字符 '-'
   */
  HYPHEN = 45,
  /**
   * 英文句点 '.'
   */
  DOT = 46,
  /**
   * 数字 '0'
   */
  ZERO = 48,
  /**
   * 数字 '9'
   */
  NINE = 57,
  /**
   * 左尖括号 '<'
   */
  OPEN_ANGLE = 60,
  /**
   * 右尖括号 '>'
   */
  CLOSE_ANGLE = 62,
  /**
   * 左方括号 '['
   */
  OPEN_BRACKET = 91,
  /**
   * 反斜杠 '\\'
   */
  BACK_SLASH = 92,
  /**
   * 右方括号 '['
   */
  CLOSE_BRACKET = 93,
  /**
   * 下划线 '_'
   */
  UNDERSCORE = 95,
  /**
   * 反引号 '`'
   */
  BACKTICK = 96,
  /**
   * 波浪号 `~`
   */
  TILDE = 126,
  /**
   * As a space, but often not adjusted
   * @see http://jkorpela.fi/chars/spaces.html
   */
  NO_BREAK_SPACE = 0x00A0,
}
