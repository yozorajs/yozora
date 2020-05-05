import { expect } from 'chai'
import { describe, it } from 'mocha'
import {
  AsciiCodePoint,
  asciiControlCharacters,
  asciiPunctuationCharacters,
  asciiWhiteSpaceCharacters,
  collectCodePointsFromEnum,
  isAsciiControlCharacter,
  isAsciiPunctuationCharacter,
  isAsciiWhiteSpaceCharacter,
} from '../src'


const logC = (c: number): string => AsciiCodePoint[c]


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

  it('Characters', function () {
    expect(whiteSpaces).to.have.members(asciiWhiteSpaceCharacters)
    expect(asciiWhiteSpaceCharacters).to.have.members(whiteSpaces)
  })

  it('Positive', function () {
    for (const c of whiteSpaces) {
      expect(isAsciiWhiteSpaceCharacter(c), logC(c)).to.be.true
    }
  })

  it('Negative', function () {
    const notWhiteSpaces = collectCodePointsFromEnum(AsciiCodePoint)
      .filter(c => whiteSpaces.indexOf(c) < 0)
    for (const c of notWhiteSpaces) {
      expect(isAsciiWhiteSpaceCharacter(c), logC(c)).to.be.false
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

  it('Characters', function () {
    expect(punctuations).to.have.members(asciiPunctuationCharacters)
    expect(asciiPunctuationCharacters).to.have.members(punctuations)
  })

  it('Positive', function () {
    for (const c of punctuations) {
      expect(isAsciiPunctuationCharacter(c), logC(c)).to.be.true
    }
  })

  it('Negative', function () {
    const notPunctuations = collectCodePointsFromEnum(AsciiCodePoint)
      .filter(c => punctuations.indexOf(c) < 0)
    for (const c of notPunctuations) {
      expect(isAsciiPunctuationCharacter(c), logC(c)).to.be.false
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

  it('Characters', function () {
    expect(controls).to.have.members(asciiControlCharacters)
    expect(asciiControlCharacters).to.have.members(controls)
  })

  it('Positive', function () {
    for (const c of controls) {
      expect(isAsciiControlCharacter(c), logC(c)).to.be.true
    }
  })

  it('Negative', function () {
    const notControls = collectCodePointsFromEnum(AsciiCodePoint)
      .filter(c => controls.indexOf(c) < 0)
    for (const c of notControls) {
      expect(isAsciiControlCharacter(c), logC(c)).to.be.false
    }
  })
})
