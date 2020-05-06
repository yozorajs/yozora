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
  collectCodePointsFromEnum,
  isUnicodeWhiteSpaceCharacter,
  unicodeWhiteSpaceCharacters,
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


describe('Unicode White Spaces', function () {
  const whiteSpaces = [
    ...new Set([
      AsciiCodePoint.HORIZONTAL_TAB,
      AsciiCodePoint.LINE_FEED,
      AsciiCodePoint.FORM_FEED,
      AsciiCodePoint.CARRIAGE_RETURN,
      ...collectCodePointsFromEnum(UnicodeZsCodePoint)
    ])
  ]

  it('Characters', function () {
    expect(whiteSpaces).to.have.members(unicodeWhiteSpaceCharacters)
    expect(unicodeWhiteSpaceCharacters).to.have.members(whiteSpaces)
  })

  it('Positive', function () {
    for (const c of whiteSpaces) {
      expect(isUnicodeWhiteSpaceCharacter(c), logC(c)).to.be.true
    }
  })

  it('Negative', function () {
    const notWhiteSpaces = collectCodePointsFromEnum(AsciiCodePoint)
      .filter(c => whiteSpaces.indexOf(c) < 0)
    for (const c of notWhiteSpaces) {
      expect(isUnicodeWhiteSpaceCharacter(c), logC(c)).to.be.false
    }
  })
})
