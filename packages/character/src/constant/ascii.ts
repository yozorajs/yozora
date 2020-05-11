/**
 * 字符编码
 */
export enum AsciiCodePoint {
  /**
   * 控制字符：空字符 `NUL` -- '\0'
   */
  NULL = 0x0000,
  /**
   * 控制字符：标题开始 `SOH`
   */
  START_OF_HEADER = 0x0001,
  /**
   * 控制字符：正文开始 `STX`
   */
  START_OF_TEXT = 0x0002,
  /**
   * 控制字符：正文结束 `ETX` / 红桃卡组
   */
  END_OF_TEXT = 0x0003,
  /**
   * 控制字符：传输结束 `EOT` / 方片卡组
   */
  END_OF_TRANSMISSION = 0x0004,
  /**
   * 控制字符：请求 `ENQ` / 梅花卡组
   */
  ENQUIRY = 0x0005,
  /**
   * 控制字符：收到通知 `ACK` / 黑桃卡组
   */
  ACKNOWLEDGEMENT = 0x0006,
  /**
   * 控制字符：响铃 `BEL` -- '\a'
   */
  BELL = 0x0007,
  /**
   * 控制字符：退格 `BS` -- '\b'
   */
  BACKSPACE = 0x0008,
  /**
   * 控制字符：水平制表符 `HT` -- '\t'
   */
  HORIZONTAL_TAB = 0x0009,
  /**
   * 控制字符：换行符 `LF` -- '\n'
   */
  LINE_FEED = 0x000a,
  /**
   * 控制字符：垂直制表符 `VT` -- '\v'
   */
  VERTICAL_TAB = 0x000b,
  /**
   * 控制字符：换页符 `FF` -- '\f`
   */
  FORM_FEED = 0x000c,
  /**
   * 控制字符：回车 `CR` -- '\r'
   */
  CARRIAGE_RETURN = 0x000d,
  /**
   * 控制字符：退出切换 `SO`
   */
  SHIFT_OUT = 0x000e,
  /**
   * 控制字符：启用切换 `SI`
   */
  SHIFT_IN = 0x000f,
  /**
   * 控制字符：数据链路转义 `DLE`
   */
  DATA_LINK_ESCAPE = 0x0010,
  /**
   * 控制字符：设备控制1 `DC1`
   */
  DEVICE_CONTROL_1 = 0x0011,
  /**
   * 控制字符：设备控制2 `DC2`
   */
  DEVICE_CONTROL_2 = 0x0012,
  /**
   * 控制字符：设备控制3 `DC3`
   */
  DEVICE_CONTROL_3 = 0x0013,
  /**
   * 控制字符：设备控制4 `DC4`
   */
  DEVICE_CONTROL_4 = 0x0014,
  /**
   * 控制字符：拒绝接收 `NAK`
   */
  NEGATIVE_ACKNOWLEDGEMENT = 0x0015,
  /**
   * 控制字符：同步空闲 `SYN`
   */
  SYNCHRONOUS_IDLE = 0x0016,
  /**
   * 控制字符：传输块结束 `ETB`
   */
  END_OF_TRANS_THE_BLOCK = 0x0017,
  /**
   * 控制字符：取消 `CAN`
   */
  CANCEL = 0x0018,
  /**
   * 控制字符：介质中断 `EM`
   */
  END_OF_MEDIUM = 0x0019,
  /**
   * 控制字符：替补 `SUB`
   */
  SUBSTITUTE = 0x001a,
  /**
   * 控制字符：逸出 `ESC` -- `\e`
   */
  ESCAPE = 0x001b,
  /**
   * 控制字符：文件分隔符 `FS`
   */
  FILE_SEPARATOR = 0x001c,
  /**
   * 控制字符：组分隔符 `GS`
   */
  GROUP_SEPARATOR = 0x001d,
  /**
   * 控制字符：记录分隔符 `RS`
   */
  RECORD_SEPARATOR = 0x001e,
  /**
   * 控制字符：单元分隔符 `US`
   */
  UNIT_SEPARATOR = 0x001f,
  /**
   * 空白符 ' '
   */
  SPACE = 0x0020,
  /**
   * 惊叹号 '!'
   */
  EXCLAMATION_MARK = 0x0021,
  /**
   * 双引号 '"'
   */
  DOUBLE_QUOTE = 0x0022,
  /**
   * 井号 '#'
   */
  NUMBER_SIGN = 0x0023,
  /**
   * 美元符号 '$'
   */
  DOLLAR = 0x0024,
  /**
   * 百分号 '%'
   */
  PERCENT_SIGN = 0x0025,
  /**
   * “和”号 '&'
   */
  AMPERSAND = 0X0026,
  /**
   * 单引号 '\''
   */
  SINGLE_QUOTE = 0x0027,
  /**
   * 左圆括号 '('
   */
  OPEN_PARENTHESIS = 0x0028,
  /**
   * 右圆括号 ')'
   */
  CLOSE_PARENTHESIS = 0x0029,
  /**
   * 星号 '*'
   */
  ASTERISK = 0x002a,
  /**
   * 加号 '+'
   */
  PLUS_SIGN = 0x002b,
  /**
   * 逗号 ','
   */
  COMMA = 0x002c,
  /**
   * 减号 '-'
   */
  MINUS_SIGN = 0x002d,
  /**
   * 英文句点 '.'
   */
  DOT = 0x002e,
  /**
   * 斜杠 '/'
   */
  FORWARD_SLASH = 0x002f,
  /**
   * 数字 '0'
   */
  NUMBER_ZERO = 0x0030,
  /**
   * 数字 '1'
   */
  NUMBER_ONE = 0x0031,
  /**
   * 数字 '2'
   */
  NUMBER_TWO = 0x0032,
  /**
   * 数字 '3'
   */
  NUMBER_THREE = 0x0033,
  /**
   * 数字 '4'
   */
  NUMBER_FOUR = 0x0034,
  /**
   * 数字 '5'
   */
  NUMBER_FIVE = 0x0035,
  /**
   * 数字 '6'
   */
  NUMBER_SIX = 0x0036,
  /**
   * 数字 '7'
   */
  NUMBER_SEVEN = 0x0037,
  /**
   * 数字 '8'
   */
  NUMBER_EIGHT = 0x0038,
  /**
   * 数字 '9'
   */
  NUMBER_NINE = 0x0039,
  /**
   * 冒号 ':'
   */
  COLON = 0x003a,
  /**
   * 分号 ';'
   */
  SEMICOLON = 0x003b,
  /**
   * 小于号/左尖括号 '<'
   */
  OPEN_ANGLE = 0x003c,
  /**
   * 等号 '='
   */
  EQUALS_SIGN = 0x003d,
  /**
   * 大于号 '>'
   */
  CLOSE_ANGLE = 0x003e,
  /**
   * 问号 '?'
   */
  QUESTION_MARK = 0x003f,
  /**
   * '@'
   */
  AT_SIGN = 0x0040,
  /**
   * 大写英文字母 'A'
   */
  UPPERCASE_LETTER_A = 0x0041,
  /**
   * 大写英文字母 'B'
   */
  UPPERCASE_LETTER_B = 0x0042,
  /**
   * 大写英文字母 'C'
   */
  UPPERCASE_LETTER_C = 0x0043,
  /**
   * 大写英文字母 'D'
   */
  UPPERCASE_LETTER_D = 0x0044,
  /**
   * 大写英文字母 'E'
   */
  UPPERCASE_LETTER_E = 0x0045,
  /**
   * 大写英文字母 'F'
   */
  UPPERCASE_LETTER_F = 0x0046,
  /**
   * 大写英文字母 'G'
   */
  UPPERCASE_LETTER_G = 0x0047,
  /**
   * 大写英文字母 'H'
   */
  UPPERCASE_LETTER_H = 0x0048,
  /**
   * 大写英文字母 'I'
   */
  UPPERCASE_LETTER_I = 0x0049,
  /**
   * 大写英文字母 'J'
   */
  UPPERCASE_LETTER_J = 0x004a,
  /**
   * 大写英文字母 'K'
   */
  UPPERCASE_LETTER_K = 0x004b,
  /**
   * 大写英文字母 'L'
   */
  UPPERCASE_LETTER_L = 0x004c,
  /**
   * 大写英文字母 'M'
   */
  UPPERCASE_LETTER_M = 0x004d,
  /**
   * 大写英文字母 'N'
   */
  UPPERCASE_LETTER_N = 0x004e,
  /**
   * 大写英文字母 'O'
   */
  UPPERCASE_LETTER_O = 0x004f,
  /**
   * 大写英文字母 'P'
   */
  UPPERCASE_LETTER_P = 0x0050,
  /**
   * 大写英文字母 'Q'
   */
  UPPERCASE_LETTER_Q = 0x0051,
  /**
   * 大写英文字母 'R'
   */
  UPPERCASE_LETTER_R = 0x0052,
  /**
   * 大写英文字母 'S'
   */
  UPPERCASE_LETTER_S = 0x0053,
  /**
   * 大写英文字母 'T'
   */
  UPPERCASE_LETTER_T = 0x0054,
  /**
   * 大写英文字母 'U'
   */
  UPPERCASE_LETTER_U = 0x0055,
  /**
   * 大写英文字母 'V'
   */
  UPPERCASE_LETTER_V = 0x0056,
  /**
   * 大写英文字母 'W'
   */
  UPPERCASE_LETTER_W = 0x0057,
  /**
   * 大写英文字母 'X'
   */
  UPPERCASE_LETTER_X = 0x0058,
  /**
   * 大写英文字母 'Y'
   */
  UPPERCASE_LETTER_Y = 0x0059,
  /**
   * 大写英文字母 'Z'
   */
  UPPERCASE_LETTER_Z = 0x005a,
  /**
   * 左方括号 '['
   */
  OPEN_BRACKET = 0x005b,
  /**
   * 反斜杠 '\\'
   */
  BACK_SLASH = 0x005c,
  /**
   * 右方括号 ']'
   */
  CLOSE_BRACKET = 0x005d,
  /**
   * 异或符/插入符 '^'
   */
  CARET = 0x005e,
  /**
   * 下划线 '_'
   */
  UNDERSCORE = 0x005f,
  /**
   * 反引号 '`'
   */
  BACKTICK = 0x0060,
  /**
   * 小写英文字母 'a'
   */
  LOWERCASE_LETTER_A = 0x0061,
  /**
   * 小写英文字母 'b'
   */
  LOWERCASE_LETTER_B = 0x0062,
  /**
   * 小写英文字母 'c'
   */
  LOWERCASE_LETTER_C = 0x0063,
  /**
   * 小写英文字母 'd'
   */
  LOWERCASE_LETTER_D = 0x0064,
  /**
   * 小写英文字母 'e'
   */
  LOWERCASE_LETTER_E = 0x0065,
  /**
   * 小写英文字母 'f'
   */
  LOWERCASE_LETTER_F = 0x0066,
  /**
   * 小写英文字母 'g'
   */
  LOWERCASE_LETTER_G = 0x0067,
  /**
   * 小写英文字母 'h'
   */
  LOWERCASE_LETTER_H = 0x0068,
  /**
   * 小写英文字母 'i'
   */
  LOWERCASE_LETTER_I = 0x0069,
  /**
   * 小写英文字母 'j'
   */
  LOWERCASE_LETTER_J = 0x006a,
  /**
   * 小写英文字母 'k'
   */
  LOWERCASE_LETTER_K = 0x006b,
  /**
   * 小写英文字母 'l'
   */
  LOWERCASE_LETTER_L = 0x006c,
  /**
   * 小写英文字母 'm'
   */
  LOWERCASE_LETTER_M = 0x006d,
  /**
   * 小写英文字母 'n'
   */
  LOWERCASE_LETTER_N = 0x006e,
  /**
   * 小写英文字母 'o'
   */
  LOWERCASE_LETTER_O = 0x006f,
  /**
   * 小写英文字母 'p'
   */
  LOWERCASE_LETTER_P = 0x0070,
  /**
   * 小写英文字母 'q'
   */
  LOWERCASE_LETTER_Q = 0x0071,
  /**
   * 小写英文字母 'r'
   */
  LOWERCASE_LETTER_R = 0x0072,
  /**
   * 小写英文字母 's'
   */
  LOWERCASE_LETTER_S = 0x0073,
  /**
   * 小写英文字母 't'
   */
  LOWERCASE_LETTER_T = 0x0074,
  /**
   * 小写英文字母 'u'
   */
  LOWERCASE_LETTER_U = 0x0075,
  /**
   * 小写英文字母 'v'
   */
  LOWERCASE_LETTER_V = 0x0076,
  /**
   * 小写英文字母 'w'
   */
  LOWERCASE_LETTER_W = 0x0077,
  /**
   * 小写英文字母 'x'
   */
  LOWERCASE_LETTER_X = 0x0078,
  /**
   * 小写英文字母 'y'
   */
  LOWERCASE_LETTER_Y = 0x0079,
  /**
   * 小写英文字母 'z'
   */
  LOWERCASE_LETTER_Z = 0x007a,
  /**
   * 左花括号 '{'
   */
  OPEN_BRACE = 0x007b,
  /**
   * 中竖线 '|'
   */
  VERTICAL_SLASH = 0x007c,
  /**
   * 右花括号 '}'
   */
  CLOSE_BRACE = 0x007d,
  /**
   * 波浪号 `~`
   */
  TILDE = 0x007e,
  /**
   * 控制字符：删除符 `DEL`
   */
  DELETE = 0x007f,
}
