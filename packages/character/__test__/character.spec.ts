import {
  AsciiCodePoint,
  UnicodePcCodePoint,
  UnicodePdCodePoint,
  UnicodePeCodePoint,
  UnicodePfCodePoint,
  UnicodePiCodePoint,
  UnicodePoCodePoint,
  UnicodePsCodePoint,
  asciiPunctuationCharacters,
  collectCodePointsFromEnum,
  controlCharacters,
  isControl,
  isPunctuationCharacter,
  isSpaceCharacter,
  isWhiteSpaceCharacter,
  punctuationCharacters,
  spaceCharacters,
  whitespaceCharacters,
} from '../src'


describe('Space', function () {
  const spaces = [
    ...new Set([
      AsciiCodePoint.SPACE,
    ])
  ]

  test('Characters', function () {
    expect(spaces.sort()).toEqual(spaceCharacters.sort())
  })

  test('Positive', function () {
    for (const c of spaces) {
      expect(isSpaceCharacter(c)).toBeTruthy()
    }
  })

  test('Negative', function () {
    const notSpaces = collectCodePointsFromEnum(AsciiCodePoint)
      .filter(c => spaces.indexOf(c) < 0)
    for (const c of notSpaces) {
      expect(isSpaceCharacter(c)).toBeFalsy()
    }
  })
})


describe('White Spaces', function () {
  const whiteSpaces = [
    ...new Set([
      AsciiCodePoint.HT,
      AsciiCodePoint.LF,
      AsciiCodePoint.VT,
      AsciiCodePoint.FF,
      AsciiCodePoint.CR,
      AsciiCodePoint.SPACE,
    ])
  ]

  test('Characters', function () {
    expect(whiteSpaces.sort()).toEqual(whitespaceCharacters.sort())
  })

  test('Positive', function () {
    for (const c of whiteSpaces) {
      expect(isWhiteSpaceCharacter(c)).toBeTruthy()
    }
  })

  test('Negative', function () {
    const notWhiteSpaces = collectCodePointsFromEnum(AsciiCodePoint)
      .filter(c => whiteSpaces.indexOf(c) < 0)
    for (const c of notWhiteSpaces) {
      expect(isWhiteSpaceCharacter(c)).toBeFalsy()
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
    ])
  ]

  test('Characters', function () {
    expect(punctuations.sort()).toEqual(punctuationCharacters.sort())
  })

  test('Positive', function () {
    for (const c of punctuations) {
      expect(isPunctuationCharacter(c)).toBeTruthy()
    }
  })

  test('Negative', function () {
    const notPunctuations = collectCodePointsFromEnum(AsciiCodePoint)
      .filter(c => punctuations.indexOf(c) < 0)
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
    ])
  ]

  test('Characters', function () {
    expect(controls.sort()).toEqual(controlCharacters.sort())
  })

  test('Positive', function () {
    for (const c of controls) {
      expect(isControl(c)).toBeTruthy()
    }
  })

  test('Negative', function () {
    const notControls = collectCodePointsFromEnum(AsciiCodePoint)
      .filter(c => controls.indexOf(c) < 0)
    for (const c of notControls) {
      expect(isControl(c)).toBeFalsy()
    }
  })
})
