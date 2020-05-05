import { expect } from 'chai'
import { describe, it } from 'mocha'
import {
  AsciiCodePoint,
  asciiPunctuationCharacters,
  asciiWhiteSpaceCharacters,
  collectCodePointsFromEnum,
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
