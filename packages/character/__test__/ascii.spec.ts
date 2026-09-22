import {
  AsciiCodePoint,
  VirtualCodePoint,
  asciiControlCharacters,
  asciiPunctuationCharacters,
  asciiWhitespaceCharacters,
  collectCodePointsFromEnum,
  isAlphanumeric,
  isAsciiCharacter,
  isAsciiControlCharacter,
  isAsciiDigitCharacter,
  isAsciiLetter,
  isAsciiLowerLetter,
  isAsciiPunctuationCharacter,
  isAsciiUpperLetter,
  isAsciiWhitespaceCharacter,
} from '../src'

const nonAsciiCodePoints = [
  VirtualCodePoint.SPACE,
  VirtualCodePoint.LINE_END,
  0x80,
  0xe9,
  0x0661,
  0xff10,
  0xff21,
  0x1f600,
]

describe('Ascii letter and alphanumeric classifiers', function () {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

  test.each([
    ['isAsciiLowerLetter', isAsciiLowerLetter, lowercase],
    ['isAsciiUpperLetter', isAsciiUpperLetter, uppercase],
    ['isAsciiLetter', isAsciiLetter, `${lowercase}${uppercase}`],
    ['isAlphanumeric', isAlphanumeric, `${lowercase}${uppercase}0123456789`],
  ] as const)('%s matches its ASCII character set', function (_name, predicate, characters) {
    for (let codePoint = 0; codePoint <= 0x7f; ++codePoint) {
      expect(predicate(codePoint), `code point ${codePoint}`).toBe(
        characters.includes(String.fromCodePoint(codePoint)),
      )
    }

    for (const codePoint of nonAsciiCodePoints) {
      expect(predicate(codePoint), `code point ${codePoint}`).toBe(false)
    }
  })
})

describe('isAsciiCharacter', function () {
  test('accepts every ASCII code point, including NUL and DEL', function () {
    for (let codePoint = 0; codePoint <= 0x7f; ++codePoint) {
      expect(isAsciiCharacter(codePoint), `code point ${codePoint}`).toBe(true)
    }
  })

  test.each(nonAsciiCodePoints)('rejects non-ASCII code point %i', function (codePoint) {
    expect(isAsciiCharacter(codePoint)).toBe(false)
  })
})

describe('Ascii White Spaces', function () {
  const whiteSpaces = [
    ...new Set([
      AsciiCodePoint.HT,
      AsciiCodePoint.LF,
      AsciiCodePoint.VT,
      AsciiCodePoint.FF,
      AsciiCodePoint.CR,
      AsciiCodePoint.SPACE,
    ]),
  ]

  test('Characters', function () {
    expect(whiteSpaces.sort()).toEqual(asciiWhitespaceCharacters.sort())
  })

  test('Positive', function () {
    for (const c of whiteSpaces) {
      expect(isAsciiWhitespaceCharacter(c)).toBeTruthy()
    }
  })

  test('Negative', function () {
    const notWhitespaces = collectCodePointsFromEnum(AsciiCodePoint).filter(
      c => whiteSpaces.indexOf(c) < 0,
    )
    for (const c of notWhitespaces) {
      expect(isAsciiWhitespaceCharacter(c)).toBeFalsy()
    }
  })
})

describe('Ascii Punctuation Spaces', function () {
  const punctuations = [
    ...new Set([
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
      AsciiCodePoint.COLON,
      AsciiCodePoint.SEMICOLON,
      AsciiCodePoint.OPEN_ANGLE,
      AsciiCodePoint.EQUALS_SIGN,
      AsciiCodePoint.CLOSE_ANGLE,
      AsciiCodePoint.QUESTION_MARK,
      AsciiCodePoint.AT_SIGN,
      AsciiCodePoint.OPEN_BRACKET,
      AsciiCodePoint.BACKSLASH,
      AsciiCodePoint.CLOSE_BRACKET,
      AsciiCodePoint.CARET,
      AsciiCodePoint.UNDERSCORE,
      AsciiCodePoint.BACKTICK,
      AsciiCodePoint.OPEN_BRACE,
      AsciiCodePoint.VERTICAL_SLASH,
      AsciiCodePoint.CLOSE_BRACE,
      AsciiCodePoint.TILDE,
    ]),
  ]

  test('Characters', function () {
    expect(punctuations.sort()).toEqual(asciiPunctuationCharacters.sort())
  })

  test('Positive', function () {
    for (const c of punctuations) {
      expect(isAsciiPunctuationCharacter(c)).toBeTruthy()
    }
  })

  test('Negative', function () {
    const notPunctuations = collectCodePointsFromEnum(AsciiCodePoint).filter(
      c => punctuations.indexOf(c) < 0,
    )
    for (const c of notPunctuations) {
      expect(isAsciiPunctuationCharacter(c)).toBeFalsy()
    }
  })
})

describe('Ascii Numbers', function () {
  const numbers = [
    ...new Set([
      AsciiCodePoint.DIGIT0,
      AsciiCodePoint.DIGIT1,
      AsciiCodePoint.DIGIT2,
      AsciiCodePoint.DIGIT3,
      AsciiCodePoint.DIGIT4,
      AsciiCodePoint.DIGIT5,
      AsciiCodePoint.DIGIT6,
      AsciiCodePoint.DIGIT7,
      AsciiCodePoint.DIGIT8,
      AsciiCodePoint.DIGIT9,
    ]),
  ]

  test('Positive', function () {
    for (const c of numbers) {
      expect(isAsciiDigitCharacter(c)).toBeTruthy()
    }
  })

  test('Negative', function () {
    const notControls = collectCodePointsFromEnum(AsciiCodePoint).filter(
      c => numbers.indexOf(c) < 0,
    )
    for (const c of notControls) {
      expect(isAsciiDigitCharacter(c)).toBeFalsy()
    }
  })
})

describe('Ascii Control Characters', function () {
  const controls = [
    ...new Set([
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
    ]),
  ]

  test('Characters', function () {
    expect(controls.sort()).toEqual(asciiControlCharacters.sort())
  })

  test('Positive', function () {
    for (const c of controls) {
      expect(isAsciiControlCharacter(c)).toBeTruthy()
    }
  })

  test('Negative', function () {
    const notControls = collectCodePointsFromEnum(AsciiCodePoint).filter(
      c => controls.indexOf(c) < 0,
    )
    for (const c of notControls) {
      expect(isAsciiControlCharacter(c)).toBeFalsy()
    }
  })
})
