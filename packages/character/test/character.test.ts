import { describe, it } from 'mocha'
import { expect } from 'chai'
import {
  AsciiCodePoint,
  UnicodePcCodePoint,
  UnicodePdCodePoint,
  UnicodePeCodePoint,
  UnicodePfCodePoint,
  UnicodePiCodePoint,
  UnicodePoCodePoint,
  UnicodePsCodePoint,
  UnicodeZsCodePoint,
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


const logC = (c: number): string => (
  AsciiCodePoint[c]
  || UnicodePcCodePoint[c]
  || UnicodePdCodePoint[c]
  || UnicodePeCodePoint[c]
  || UnicodePfCodePoint[c]
  || UnicodePiCodePoint[c]
  || UnicodePoCodePoint[c]
  || UnicodePsCodePoint[c]
  || UnicodeZsCodePoint[c]
)


describe('Space', function () {
  const spaces = [
    ...new Set([
      AsciiCodePoint.SPACE,
    ])
  ]

  it('Characters', function () {
    expect(spaces).to.have.members(spaceCharacters)
    expect(spaceCharacters).to.have.members(spaces)
  })

  it('Positive', function () {
    for (const c of spaces) {
      expect(isSpaceCharacter(c), logC(c)).to.be.true
    }
  })

  it('Negative', function () {
    const notSpaces = collectCodePointsFromEnum(AsciiCodePoint)
      .filter(c => spaces.indexOf(c) < 0)
    for (const c of notSpaces) {
      expect(isSpaceCharacter(c), logC(c)).to.be.false
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

  it('Characters', function () {
    expect(whiteSpaces).to.have.members(whitespaceCharacters)
    expect(whitespaceCharacters).to.have.members(whiteSpaces)
  })

  it('Positive', function () {
    for (const c of whiteSpaces) {
      expect(isWhiteSpaceCharacter(c), logC(c)).to.be.true
    }
  })

  it('Negative', function () {
    const notWhiteSpaces = collectCodePointsFromEnum(AsciiCodePoint)
      .filter(c => whiteSpaces.indexOf(c) < 0)
    for (const c of notWhiteSpaces) {
      expect(isWhiteSpaceCharacter(c), logC(c)).to.be.false
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

  it('Characters', function () {
    expect(punctuations).to.have.members(punctuationCharacters)
    expect(punctuationCharacters).to.have.members(punctuations)
  })

  it('Positive', function () {
    for (const c of punctuations) {
      expect(isPunctuationCharacter(c), logC(c)).to.be.true
    }
  })

  it('Negative', function () {
    const notPunctuations = collectCodePointsFromEnum(AsciiCodePoint)
      .filter(c => punctuations.indexOf(c) < 0)
    for (const c of notPunctuations) {
      expect(isPunctuationCharacter(c), logC(c)).to.be.false
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

  it('Characters', function () {
    expect(controls).to.have.members(controlCharacters)
    expect(controlCharacters).to.have.members(controls)
  })

  it('Positive', function () {
    for (const c of controls) {
      expect(isControlCharacter(c), logC(c)).to.be.true
    }
  })

  it('Negative', function () {
    const notControls = collectCodePointsFromEnum(AsciiCodePoint)
      .filter(c => controls.indexOf(c) < 0)
    for (const c of notControls) {
      expect(isControlCharacter(c), logC(c)).to.be.false
    }
  })
})
