import { CodePoint } from '../constant/character'


/**
 * Determine if a character is a Whitespace Character
 * @param c
 * @see https://github.github.com/gfm/#whitespace-character
 */
export function isUnicodeWhiteSpace(c: CodePoint): boolean {
  switch (c) {
    case CodePoint.TAB:
    case CodePoint.LINE_FEED:
    case CodePoint.LINE_TABULATION:
    case CodePoint.FORM_FEED:
    case CodePoint.CARRIAGE_RETURN:
    case CodePoint.SPACE:
    case CodePoint.NO_BREAK_SPACE:
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
export function isASCIIControlCharacter(c: CodePoint): boolean {
  return (c >= 0x00 && c <= 0x1F) || c === 0x7F
}



/**
 * Determines whether it is a punctuation mark in a unicode encoding
 * @param c
 * @see https://www.fileformat.info/info/unicode/category/Po/list.htm
 */
const UNICODE_PUNCTUATION_CODES = [
  0x00021, 0x00024,
  0x00025, 0x00028,
  0x0002A, 0x0002B,
  0x0002C, 0x0002D,
  0x0002E, 0x00030,
  0x0003A, 0x0003C,
  0x0003F, 0x00041,
  0x0005C, 0x0005D,
  0x000A1, 0x000A2,
  0x000A7, 0x000A8,
  0x000B6, 0x000B8,
  0x000BF, 0x000C0,
  0x0037E, 0x0037F,
  0x00387, 0x00388,
  0x0055A, 0x00560,
  0x00589, 0x0058A,
  0x005C0, 0x005C1,
  0x005C3, 0x005C4,
  0x005C6, 0x005C7,
  0x005F3, 0x005F5,
  0x00609, 0x0060B,
  0x0060C, 0x0060E,
  0x0061B, 0x0061C,
  0x0061E, 0x00620,
  0x0066A, 0x0066E,
  0x006D4, 0x006D5,
  0x00700, 0x0070E,
  0x007F7, 0x007FA,
  0x00830, 0x0083F,
  0x0085E, 0x0085F,
  0x00964, 0x00966,
  0x00970, 0x00971,
  0x009FD, 0x009FE,
  0x00A76, 0x00A77,
  0x00AF0, 0x00AF1,
  0x00C77, 0x00C78,
  0x00C84, 0x00C85,
  0x00DF4, 0x00DF5,
  0x00E4F, 0x00E50,
  0x00E5A, 0x00E5C,
  0x00F04, 0x00F13,
  0x00F14, 0x00F15,
  0x00F85, 0x00F86,
  0x00FD0, 0x00FD5,
  0x00FD9, 0x00FDB,
  0x0104A, 0x01050,
  0x010FB, 0x010FC,
  0x01360, 0x01369,
  0x0166E, 0x0166F,
  0x016EB, 0x016EE,
  0x01735, 0x01737,
  0x017D4, 0x017D7,
  0x017D8, 0x017DB,
  0x01800, 0x01806,
  0x01807, 0x0180B,
  0x01944, 0x01946,
  0x01A1E, 0x01A20,
  0x01AA0, 0x01AA7,
  0x01AA8, 0x01AAE,
  0x01B5A, 0x01B61,
  0x01BFC, 0x01C00,
  0x01C3B, 0x01C40,
  0x01C7E, 0x01C80,
  0x01CC0, 0x01CC8,
  0x01CD3, 0x01CD4,
  0x02016, 0x02018,
  0x02020, 0x02028,
  0x02030, 0x02039,
  0x0203B, 0x0203F,
  0x02041, 0x02044,
  0x02047, 0x02052,
  0x02053, 0x02054,
  0x02055, 0x0205F,
  0x02CF9, 0x02CFD,
  0x02CFE, 0x02D00,
  0x02D70, 0x02D71,
  0x02E00, 0x02E02,
  0x02E06, 0x02E09,
  0x02E0B, 0x02E0C,
  0x02E0E, 0x02E17,
  0x02E18, 0x02E1A,
  0x02E1B, 0x02E1C,
  0x02E1E, 0x02E20,
  0x02E2A, 0x02E2F,
  0x02E30, 0x02E3A,
  0x02E3C, 0x02E40,
  0x02E41, 0x02E42,
  0x02E43, 0x02E50,
  0x03001, 0x03004,
  0x0303D, 0x0303E,
  0x030FB, 0x030FC,
  0x0A4FE, 0x0A500,
  0x0A60D, 0x0A610,
  0x0A673, 0x0A674,
  0x0A67E, 0x0A67F,
  0x0A6F2, 0x0A6F8,
  0x0A874, 0x0A878,
  0x0A8CE, 0x0A8D0,
  0x0A8F8, 0x0A8FB,
  0x0A8FC, 0x0A8FD,
  0x0A92E, 0x0A930,
  0x0A95F, 0x0A960,
  0x0A9C1, 0x0A9CE,
  0x0A9DE, 0x0A9E0,
  0x0AA5C, 0x0AA60,
  0x0AADE, 0x0AAE0,
  0x0AAF0, 0x0AAF2,
  0x0ABEB, 0x0ABEC,
  0x0FE10, 0x0FE17,
  0x0FE19, 0x0FE1A,
  0x0FE30, 0x0FE31,
  0x0FE45, 0x0FE47,
  0x0FE49, 0x0FE4D,
  0x0FE50, 0x0FE53,
  0x0FE54, 0x0FE58,
  0x0FE5F, 0x0FE62,
  0x0FE68, 0x0FE69,
  0x0FE6A, 0x0FE6C,
  0x0FF01, 0x0FF04,
  0x0FF05, 0x0FF08,
  0x0FF0A, 0x0FF0B,
  0x0FF0C, 0x0FF0D,
  0x0FF0E, 0x0FF10,
  0x0FF1A, 0x0FF1C,
  0x0FF1F, 0x0FF21,
  0x0FF3C, 0x0FF3D,
  0x0FF61, 0x0FF62,
  0x0FF64, 0x0FF66,
  0x10100, 0x10103,
  0x1039F, 0x103A0,
  0x103D0, 0x103D1,
  0x1056F, 0x10570,
  0x10857, 0x10858,
  0x1091F, 0x10920,
  0x1093F, 0x10940,
  0x10A50, 0x10A59,
  0x10A7F, 0x10A80,
  0x10AF0, 0x10AF7,
  0x10B39, 0x10B40,
  0x10B99, 0x10B9D,
  0x10F55, 0x10F5A,
  0x11047, 0x1104E,
  0x110BB, 0x110BD,
  0x110BE, 0x110C2,
  0x11140, 0x11144,
  0x11174, 0x11176,
  0x111C5, 0x111C9,
  0x111CD, 0x111CE,
  0x111DB, 0x111DC,
  0x111DD, 0x111E0,
  0x11238, 0x1123E,
  0x112A9, 0x112AA,
  0x1144B, 0x11450,
  0x1145B, 0x1145C,
  0x1145D, 0x1145E,
  0x114C6, 0x114C7,
  0x115C1, 0x115D8,
  0x11641, 0x11644,
  0x11660, 0x1166D,
  0x1173C, 0x1173F,
  0x1183B, 0x1183C,
  0x119E2, 0x119E3,
  0x11A3F, 0x11A47,
  0x11A9A, 0x11A9D,
  0x11A9E, 0x11AA3,
  0x11C41, 0x11C46,
  0x11C70, 0x11C72,
  0x11EF7, 0x11EF9,
  0x11FFF, 0x12000,
  0x12470, 0x12475,
  0x16A6E, 0x16A70,
  0x16AF5, 0x16AF6,
  0x16B37, 0x16B3C,
  0x16B44, 0x16B45,
  0x16E97, 0x16E9B,
  0x16FE2, 0x16FE3,
  0x1BC9F, 0x1BCA0,
  0x1DA87, 0x1DA8C,
  0x1E95E, 0x1E960,
]

/**
 * And the following characters are treated as punctuation in gfm
 */
const GFM_UNICODE_PUNCTUATION_CODES = [
  0x00028,  // '('
  0x00029,  // ')'
  0X0002B,  // '+'
  0X0002D,  // '-'
  0X0003C,  // '<'
  0X0003D,  // '='
  0x0003E,  // '>'
  0x0005B,  // '['
  0x0005D,  // ']'
]
export function isUnicodePunctuationCharacter(c: CodePoint, gfm = false): boolean {
  // binary search
  let lft = 0, rht = UNICODE_PUNCTUATION_CODES.length
  while (lft < rht) {
    const mid = (lft + rht) >>> 1
    if (c < UNICODE_PUNCTUATION_CODES[mid]) rht = mid
    else lft = mid + 1
  }

  // if rht is an even number, c is in the bad range
  // otherwise, it's a valid punctuation character
  if (rht & 1) return true

  // Determine if it is a punctuation mark defined in gfm
  if (gfm) return GFM_UNICODE_PUNCTUATION_CODES.indexOf(c) >= 0
  return false
}