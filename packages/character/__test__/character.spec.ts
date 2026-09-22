import {
  AsciiCodePoint,
  UnicodePcCodePoint,
  UnicodePdCodePoint,
  UnicodePeCodePoint,
  UnicodePfCodePoint,
  UnicodePiCodePoint,
  UnicodePoCodePoint,
  UnicodePsCodePoint,
  VirtualCodePoint,
  asciiPunctuationCharacters,
  collectCodePointsFromEnum,
  controlCharacters,
  createNodePointGenerator,
  isControlCharacter,
  isLineEnding,
  isPunctuationCharacter,
  isSpaceCharacter,
  isSpaceLike,
  isWhitespaceCharacter,
  punctuationCharacters,
  spaceCharacters,
  whitespaceCharacters,
} from '../src'

describe('Normalized spaces and line endings', function () {
  test.each([
    [VirtualCodePoint.LINE_END, true, true],
    [VirtualCodePoint.SPACE, false, true],
    [AsciiCodePoint.SPACE, false, true],
    [AsciiCodePoint.NUL, false, false],
    [AsciiCodePoint.HT, false, false],
    [AsciiCodePoint.LF, false, false],
    [AsciiCodePoint.CR, false, false],
    [AsciiCodePoint.VT, false, false],
    [AsciiCodePoint.FF, false, false],
    [AsciiCodePoint.UPPERCASE_A, false, false],
    [0xa0, false, false],
    [0x2028, false, false],
    [-3, false, false],
  ] as const)('classifies code point %i', function (codePoint, lineEnding, spaceLike) {
    expect(isLineEnding(codePoint)).toBe(lineEnding)
    expect(isSpaceLike(codePoint)).toBe(spaceLike)
  })

  test('recognizes spaces and line endings after source normalization', function () {
    const points = [...createNodePointGenerator('\t \r\nA\rB\n')].flat()
    const lineEndOffsets = points
      .filter(point => isLineEnding(point.codePoint))
      .map(point => point.offset)
    const spaceLikeOffsets = points
      .filter(point => isSpaceLike(point.codePoint))
      .map(point => point.offset)

    expect(lineEndOffsets).toEqual([2, 5, 7])
    expect(spaceLikeOffsets).toEqual([0, 0, 0, 0, 1, 2, 5, 7])
  })
})

describe('Space', function () {
  const spaces = [...new Set([AsciiCodePoint.SPACE, VirtualCodePoint.SPACE])]

  test('Characters', function () {
    expect(spaces.sort()).toEqual(spaceCharacters.sort())
  })

  test('Positive', function () {
    for (const c of spaces) {
      expect(isSpaceCharacter(c)).toBeTruthy()
    }
  })

  test('Negative', function () {
    const notSpaces = collectCodePointsFromEnum(AsciiCodePoint).filter(c => spaces.indexOf(c) < 0)
    for (const c of notSpaces) {
      expect(isSpaceCharacter(c)).toBeFalsy()
    }
  })
})

describe('White Spaces', function () {
  const whiteSpaces = [
    ...new Set([
      AsciiCodePoint.VT,
      AsciiCodePoint.FF,
      AsciiCodePoint.SPACE,
      VirtualCodePoint.SPACE,
      VirtualCodePoint.LINE_END,
    ]),
  ]

  test('Characters', function () {
    expect(whiteSpaces.sort()).toEqual(whitespaceCharacters.sort())
  })

  test('Positive', function () {
    for (const c of whiteSpaces) {
      expect(isWhitespaceCharacter(c)).toBeTruthy()
    }
  })

  test('Negative', function () {
    const notWhitespaces = collectCodePointsFromEnum(AsciiCodePoint).filter(
      c => whiteSpaces.indexOf(c) < 0,
    )
    for (const c of notWhitespaces) {
      expect(isWhitespaceCharacter(c)).toBeFalsy()
    }
  })
})

describe('Punctuation Spaces', function () {
  const punctuations = [
    ...new Set([
      ...asciiPunctuationCharacters,
      ...collectCodePointsFromEnum(UnicodePcCodePoint),
      ...collectCodePointsFromEnum(UnicodePdCodePoint),
      ...collectCodePointsFromEnum(UnicodePeCodePoint),
      ...collectCodePointsFromEnum(UnicodePfCodePoint),
      ...collectCodePointsFromEnum(UnicodePiCodePoint),
      ...collectCodePointsFromEnum(UnicodePoCodePoint),
      ...collectCodePointsFromEnum(UnicodePsCodePoint),
    ]),
  ]

  test('Characters', function () {
    expect(punctuations.sort()).toEqual(punctuationCharacters.sort())
  })

  test('Positive', function () {
    for (const c of punctuations) {
      expect(isPunctuationCharacter(c)).toBeTruthy()
    }
  })

  test('Unicode 17.0 additions', function () {
    const additions = [
      UnicodePoCodePoint.ARABIC_END_OF_TEXT_MARK,
      UnicodePdCodePoint.GARAY_HYPHEN,
      UnicodePeCodePoint.BOTTOM_HALF_RIGHT_PARENTHESIS,
      UnicodePsCodePoint.BOTTOM_HALF_LEFT_PARENTHESIS,
      UnicodePoCodePoint.OL_ONAL_ABBREVIATION_SIGN,
    ]

    for (const c of additions) {
      expect(isPunctuationCharacter(c)).toBeTruthy()
    }
  })

  test('Negative', function () {
    const notPunctuations = collectCodePointsFromEnum(AsciiCodePoint).filter(
      c => punctuations.indexOf(c) < 0,
    )
    for (const c of notPunctuations) {
      expect(isPunctuationCharacter(c)).toBeFalsy()
    }
  })
})

describe('Control Characters', function () {
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
    expect(controls.sort()).toEqual(controlCharacters.sort())
  })

  test('Positive', function () {
    for (const c of controls) {
      expect(isControlCharacter(c)).toBeTruthy()
    }
  })

  test('Negative', function () {
    const notControls = collectCodePointsFromEnum(AsciiCodePoint).filter(
      c => controls.indexOf(c) < 0,
    )
    for (const c of notControls) {
      expect(isControlCharacter(c)).toBeFalsy()
    }
  })
})
