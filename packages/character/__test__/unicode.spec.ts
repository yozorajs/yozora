import {
  AsciiCodePoint,
  UnicodeZsCodePoint,
  collectCodePointsFromEnum,
  isUnicodeWhiteSpaceCharacter,
  unicodeWhiteSpaceCharacters,
} from '../src'


describe('Unicode White Spaces', function () {
  const whiteSpaces = [
    ...new Set([
      AsciiCodePoint.HT,
      AsciiCodePoint.LF,
      AsciiCodePoint.FF,
      AsciiCodePoint.CR,
      ...collectCodePointsFromEnum(UnicodeZsCodePoint)
    ])
  ]

  test('Characters', function () {
    expect(whiteSpaces.sort()).toEqual(unicodeWhiteSpaceCharacters.sort())
  })

  test('Positive', function () {
    for (const c of whiteSpaces) {
      expect(isUnicodeWhiteSpaceCharacter(c)).toBeTruthy
    }
  })

  test('Negative', function () {
    const notWhiteSpaces = collectCodePointsFromEnum(AsciiCodePoint)
      .filter(c => whiteSpaces.indexOf(c) < 0)
    for (const c of notWhiteSpaces) {
      expect(isUnicodeWhiteSpaceCharacter(c)).toBeFalsy()
    }
  })
})
