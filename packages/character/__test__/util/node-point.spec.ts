import {
  AsciiCodePoint,
  VirtualCodePoint,
  calcEscapedStringFromNodePoints,
  calcStringFromNodePoints,
  calcTrimBoundaryOfCodePoints,
  createNodePointGenerator,
} from '../../src'

describe('node-point', function () {
  test('createNodePointGenerator normalizes control characters', function () {
    const [points] = [...createNodePointGenerator('\tA\r\nB\rC\n\0')]

    const codePoints = points.map(p => p.codePoint)
    expect(codePoints).toEqual([
      VirtualCodePoint.SPACE,
      VirtualCodePoint.SPACE,
      VirtualCodePoint.SPACE,
      VirtualCodePoint.SPACE,
      AsciiCodePoint.UPPERCASE_A,
      VirtualCodePoint.LINE_END,
      AsciiCodePoint.UPPERCASE_B,
      VirtualCodePoint.LINE_END,
      AsciiCodePoint.UPPERCASE_C,
      VirtualCodePoint.LINE_END,
      0xfffd,
    ])
  })

  test('calcStringFromNodePoints keeps tab and newline semantics', function () {
    const [points] = [...createNodePointGenerator('\tA\n')]

    expect(calcStringFromNodePoints(points)).toBe('\tA\n')
    expect(calcStringFromNodePoints(points, 0, points.length, true)).toBe('A')
  })

  test('calcEscapedStringFromNodePoints resolves escapes and entities', function () {
    const [points] = [...createNodePointGenerator('\\* \\a &amp;')]

    expect(calcEscapedStringFromNodePoints(points)).toBe('* \\a &')
  })

  test('calcTrimBoundaryOfCodePoints trims boundary whitespaces only', function () {
    const [points] = [...createNodePointGenerator('  hello  ')]

    expect(calcTrimBoundaryOfCodePoints(points)).toEqual([2, 7])
    expect(calcStringFromNodePoints(points, 0, points.length, true)).toBe('hello')
  })
})
