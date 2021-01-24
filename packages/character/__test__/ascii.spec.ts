import {
  AsciiCodePoint,
  asciiControlCharacters,
  asciiPunctuationCharacters,
  asciiWhiteSpaceCharacters,
  collectCodePointsFromEnum,
  isAsciiControlCharacter,
  isAsciiDigit,
  isAsciiPunctuationCharacter,
  isAsciiWhiteSpaceCharacter,
} from '../src'


describe('Ascii White Spaces', function () {
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
    expect(whiteSpaces.sort()).toEqual(asciiWhiteSpaceCharacters.sort())
  })

  test('Positive', function () {
    for (const c of whiteSpaces) {
      expect(isAsciiWhiteSpaceCharacter(c)).toBeTruthy()
    }
  })

  test('Negative', function () {
    const notWhiteSpaces = collectCodePointsFromEnum(AsciiCodePoint)
      .filter(c => whiteSpaces.indexOf(c) < 0)
    for (const c of notWhiteSpaces) {
      expect(isAsciiWhiteSpaceCharacter(c)).toBeFalsy()
    }
  })
})


describe('Ascii Punctuation Spaces', function () {
  const punctuations = [
    ...new Set([
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
      AsciiCodePoint.COLON,
      AsciiCodePoint.SEMICOLON,
      AsciiCodePoint.OPEN_ANGLE,
      AsciiCodePoint.EQUALS_SIGN,
      AsciiCodePoint.CLOSE_ANGLE,
      AsciiCodePoint.QUESTION_MARK,
      AsciiCodePoint.AT_SIGN,
      AsciiCodePoint.OPEN_BRACKET,
      AsciiCodePoint.BACK_SLASH,
      AsciiCodePoint.CLOSE_BRACKET,
      AsciiCodePoint.CARET,
      AsciiCodePoint.UNDERSCORE,
      AsciiCodePoint.BACKTICK,
      AsciiCodePoint.OPEN_BRACE,
      AsciiCodePoint.VERTICAL_SLASH,
      AsciiCodePoint.CLOSE_BRACE,
      AsciiCodePoint.TILDE,
    ])
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
    const notPunctuations = collectCodePointsFromEnum(AsciiCodePoint)
      .filter(c => punctuations.indexOf(c) < 0)
    for (const c of notPunctuations) {
      expect(isAsciiPunctuationCharacter(c)).toBeFalsy()
    }
  })
})


describe('Ascii Numbers', function () {
  const numbers = [
    ...new Set([
      AsciiCodePoint.NUMBER_ZERO,
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
  ]

  test('Positive', function () {
    for (const c of numbers) {
      expect(isAsciiDigit(c)).toBeTruthy()
    }
  })

  test('Negative', function () {
    const notControls = collectCodePointsFromEnum(AsciiCodePoint)
      .filter(c => numbers.indexOf(c) < 0)
    for (const c of notControls) {
      expect(isAsciiDigit(c)).toBeFalsy()
    }
  })
})


describe('Ascii Control Characters', function () {
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
    expect(controls.sort()).toEqual(asciiControlCharacters.sort())
  })

  test('Positive', function () {
    for (const c of controls) {
      expect(isAsciiControlCharacter(c)).toBeTruthy()
    }
  })

  test('Negative', function () {
    const notControls = collectCodePointsFromEnum(AsciiCodePoint)
      .filter(c => controls.indexOf(c) < 0)
    for (const c of notControls) {
      expect(isAsciiControlCharacter(c)).toBeFalsy()
    }
  })
})
