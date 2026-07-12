import {
  AsciiCodePoint,
  VirtualCodePoint,
  calcEscapedStringFromNodePoints,
  calcStringFromNodePoints,
  calcTrimBoundaryOfCodePoints,
  createNodePointGenerator,
} from '../../src'

const collectNodePoints = (input: Iterable<string> | string) =>
  [...createNodePointGenerator(input)].flat()

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

  for (const content of ['a\r\nb', 'a😀b', 'a\r\n😀b', 'text\r', 'text\uD800']) {
    test(`createNodePointGenerator is chunk-independent for ${JSON.stringify(content)}`, () => {
      const expected = collectNodePoints(content)

      for (let i = 0; i <= content.length; ++i) {
        expect(collectNodePoints([content.slice(0, i), content.slice(i)])).toEqual(expected)
      }
      expect(collectNodePoints(content.split(''))).toEqual(expected)
    })
  }

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
