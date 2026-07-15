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

const collectEndPoint = (input: Iterable<string> | string) => {
  const iterator = createNodePointGenerator(input)
  let result = iterator.next()
  while (!result.done) result = iterator.next()
  return result.value
}

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

  test.each([
    ['empty input', '', { line: 1, column: 1, offset: 0 }],
    ['LF', 'a\n', { line: 2, column: 1, offset: 2 }],
    ['chunked CRLF', ['a\r', '\n'], { line: 2, column: 1, offset: 3 }],
    ['astral Unicode', '😀', { line: 1, column: 3, offset: 2 }],
  ])('reports source EOF for %s', (_name, input, expected) => {
    expect(collectEndPoint(input)).toEqual(expected)
  })

  test('keeps offsets usable as source string indices', () => {
    const content = 'a😀b'
    const points = collectNodePoints(content)
    const point = points.find(p => p.codePoint === AsciiCodePoint.LOWERCASE_B)!

    expect(point.offset).toBe(content.indexOf('b'))
    expect(content.slice(point.offset)).toBe('b')
  })

  test('calcStringFromNodePoints keeps tab and newline semantics', function () {
    const [points] = [...createNodePointGenerator('\tA\n')]

    expect(calcStringFromNodePoints(points)).toBe('\tA\n')
    expect(calcStringFromNodePoints(points, 0, points.length, true)).toBe('A')
  })

  test('string reconstruction does not merge partial adjacent tabs', function () {
    const points = collectNodePoints('\t\t')

    expect(calcStringFromNodePoints(points)).toBe('\t\t')
    expect(calcEscapedStringFromNodePoints(points)).toBe('\t\t')
    expect(calcStringFromNodePoints(points, 2, 6)).toBe('    ')
    expect(calcEscapedStringFromNodePoints(points, 2, 6)).toBe('    ')
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
