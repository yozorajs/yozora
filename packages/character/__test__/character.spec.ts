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
  isControlCharacter,
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
      AsciiCodePoint.HORIZONTAL_TAB,
      AsciiCodePoint.LINE_FEED,
      AsciiCodePoint.VERTICAL_TAB,
      AsciiCodePoint.FORM_FEED,
      AsciiCodePoint.CARRIAGE_RETURN,
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
    const notControls = collectCodePointsFromEnum(AsciiCodePoint)
      .filter(c => controls.indexOf(c) < 0)
    for (const c of notControls) {
      expect(isControlCharacter(c)).toBeFalsy()
    }
  })
})
