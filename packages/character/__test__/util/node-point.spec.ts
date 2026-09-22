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

    expect(points[5].sourceWidth).toBe(2)
    expect(points[7].sourceWidth).toBeUndefined()
    expect(points[9].sourceWidth).toBeUndefined()
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

  test('keeps offsets usable as source string indices', () => {
    const content = 'a😀b'
    const points = collectNodePoints(content)
    const point = points.find(p => p.codePoint === AsciiCodePoint.LOWERCASE_B)!

    expect(point.offset).toBe(content.indexOf('b'))
    expect(content.slice(point.offset)).toBe('b')
  })

  test('calcStringFromNodePoints keeps tab and newline semantics', function () {
    const [points] = [...createNodePointGenerator('\tA\n')]

    expect(points[0]).toBe(points[1])
    expect(points[0]).toBe(points[2])
    expect(points[0]).toBe(points[3])
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

  test('trims source boundaries while preserving internal whitespace and decoding entities', function () {
    const points = collectNodePoints(' \t\\*  &amp;\tvalue\r\n ')
    const original = structuredClone(points)

    expect(calcEscapedStringFromNodePoints(points, 0, points.length, true)).toBe('*  &\tvalue')
    expect(points).toEqual(original)
  })

  test.each(['', ' \t\r\n '])('trims an empty or whitespace-only source %j', function (source) {
    const points = collectNodePoints(source)

    expect(calcEscapedStringFromNodePoints(points, 0, points.length, true)).toBe('')
  })

  test('reconstructs normalized line endings while decoding entity references', function () {
    const points = collectNodePoints('a\r\n&amp;\rb\n')

    expect(calcEscapedStringFromNodePoints(points)).toBe('a\n&\nb\n')
  })

  test.each(['&', '&zzzz;', '&#12', '&#x41', '&#12x;', '&#x41g;'])(
    'preserves invalid entity %s and still decodes a later valid reference',
    function (source) {
      const points = collectNodePoints(`${source} &amp;`)

      expect(calcEscapedStringFromNodePoints(points)).toBe(`${source} &`)
    },
  )

  test('does not complete an entity using points beyond the selected range', function () {
    const points = collectNodePoints('x&amp;y')

    expect(calcEscapedStringFromNodePoints(points, 1, 5)).toBe('&amp')
    expect(calcEscapedStringFromNodePoints(points, 1, 6)).toBe('&')
    expect(calcEscapedStringFromNodePoints(points, 3, 3)).toBe('')
  })

  test('does not complete an escape using points beyond the selected range', function () {
    const points = collectNodePoints('x\\*y')

    expect(calcEscapedStringFromNodePoints(points, 1, 2)).toBe('\\')
    expect(calcEscapedStringFromNodePoints(points, 1, 3)).toBe('*')
  })

  test('calcTrimBoundaryOfCodePoints trims boundary whitespaces only', function () {
    const [points] = [...createNodePointGenerator('  hello  ')]

    expect(calcTrimBoundaryOfCodePoints(points)).toEqual([2, 7])
    expect(calcStringFromNodePoints(points, 0, points.length, true)).toBe('hello')
  })
})
