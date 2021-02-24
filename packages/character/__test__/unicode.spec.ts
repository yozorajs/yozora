import {
  AsciiCodePoint,
  UnicodeZsCodePoint,
  VirtualCodePoint,
  collectCodePointsFromEnum,
  isUnicodeWhitespaceCharacter,
  unicodeWhitespaceCharacters,
} from '../src'

describe('Unicode White Spaces', function () {
  const whiteSpaces = [
    ...new Set([
      AsciiCodePoint.HT,
      AsciiCodePoint.LF,
      AsciiCodePoint.FF,
      AsciiCodePoint.CR,
      VirtualCodePoint.SPACE,
      VirtualCodePoint.LINE_END,
      ...collectCodePointsFromEnum(UnicodeZsCodePoint),
    ]),
  ]

  test('Characters', function () {
    expect(whiteSpaces.sort()).toEqual(unicodeWhitespaceCharacters.sort())
  })

  test('Positive', function () {
    for (const c of whiteSpaces) {
      expect(isUnicodeWhitespaceCharacter(c)).toBeTruthy
    }
  })

  test('Negative', function () {
    const notWhitespaces = collectCodePointsFromEnum(AsciiCodePoint).filter(
      c => whiteSpaces.indexOf(c) < 0,
    )
    for (const c of notWhitespaces) {
      expect(isUnicodeWhitespaceCharacter(c)).toBeFalsy()
    }
  })
})
