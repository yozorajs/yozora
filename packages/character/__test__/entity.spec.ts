import type { INodePoint } from '../src'
import {
  createEntityReferenceTrie,
  eatEntityReference,
  entityReferenceTrie,
  entityReferences,
} from '../src'

function toNodePoints(source: string): Pick<INodePoint, 'codePoint'>[] {
  return Array.from(source, character => ({ codePoint: character.codePointAt(0)! }))
}

describe('createEntityReferenceTrie', function () {
  it('returns no match before any entities are inserted', function () {
    const trie = createEntityReferenceTrie()
    const points = toNodePoints('amp;')

    expect(trie.search(points, 0, points.length)).toBeNull()
  })

  it('preserves lookups and rejects missing keys after unordered insertions', function () {
    const trie = createEntityReferenceTrie()
    const entries = [
      ['notin;', '∉'],
      ['zeta;', 'ζ'],
      ['amp;', '&'],
      ['not;', '¬'],
      ['alpha;', 'α'],
      ['lt;', '<'],
      ['gt;', '>'],
      ['beta;', 'β'],
    ] as const

    for (const [name, value] of entries) {
      trie.insert(
        Array.from(name, character => character.codePointAt(0)!),
        value,
      )
    }

    for (const [name, value] of entries) {
      const points = toNodePoints(`${name}tail`)
      expect(trie.search(points, 0, points.length)).toEqual({ nextIndex: name.length, value })
    }
    for (const name of ['zzzz;', 'unknown;', 'notin', 'beta']) {
      const points = toNodePoints(name)
      expect(trie.search(points, 0, points.length), name).toBeNull()
    }
  })
})

describe('entity', function () {
  it('Entity reference trie.', function () {
    for (const entity of entityReferences) {
      const nodePoints = entity.key.map(c => ({ codePoint: c }))
      expect(entityReferenceTrie.search(nodePoints, 0, nodePoints.length)).toEqual({
        nextIndex: nodePoints.length,
        value: entity.value,
      })
    }
  })

  it('Trailing semicolon is required.', function () {
    const nodePoints = '&nbsp;'.split('').map(c => ({ codePoint: c.codePointAt(0)! }))

    expect(entityReferenceTrie.search(nodePoints, 1, nodePoints.length)).toEqual({
      nextIndex: nodePoints.length,
      value: ' ',
    })

    expect(entityReferenceTrie.search(nodePoints, 1, nodePoints.length - 1)).toBeNull()
  })

  describe('eatEntityReference', function () {
    it('rejects an empty range', function () {
      expect(eatEntityReference([], 0, 0)).toBeNull()
    })

    it.each(['&', '&#', '&a', '&zzzz;', '&#12', '&#x41', '&#12x;', '&#x41g;'])(
      'rejects an incomplete or invalid entity: %s',
      source => {
        const points = toNodePoints(source)

        expect(eatEntityReference(points, 1, points.length)).toBeNull()
      },
    )

    it.each(['&#00000065;', '&#x0000041;'])(
      'rejects an overlong numeric entity even when its value is valid: %s',
      source => {
        const points = toNodePoints(source)

        expect(eatEntityReference(points, 1, points.length)).toBeNull()
      },
    )

    it.each(['&#0000065;', '&#x000041;', '&#X000041;'])(
      'accepts the maximum digit count in %s',
      source => {
        const points = toNodePoints(source)

        expect(eatEntityReference(points, 1, points.length)).toEqual({
          nextIndex: points.length,
          value: 'A',
        })
      },
    )

    it.each([
      ['x&amp;y', 6, '&'],
      ['x&#65;y', 6, 'A'],
      ['x&#x41;y', 7, 'A'],
    ])(
      'respects the range boundary and preserves trailing text in %s',
      (source, endIndex, value) => {
        const points = toNodePoints(source)

        expect(eatEntityReference(points, 2, endIndex - 1)).toBeNull()
        expect(eatEntityReference(points, 2, endIndex)).toEqual({ nextIndex: endIndex, value })
        expect(eatEntityReference(points, 2, points.length)).toEqual({ nextIndex: endIndex, value })
      },
    )

    it('html entity', function () {
      const nodePoints = '&nbsp;'.split('').map(c => ({ codePoint: c.codePointAt(0)! }))

      expect(eatEntityReference(nodePoints, 0, nodePoints.length)).toBeNull()
      expect(eatEntityReference(nodePoints, 1, nodePoints.length)).toEqual({
        nextIndex: nodePoints.length,
        value: ' ',
      })
    })

    it.each([
      ['&lbrace;', '{'],
      ['&lcub;', '{'],
      ['&rbrace;', '}'],
      ['&rcub;', '}'],
    ])('decodes %s without adding whitespace', (source, expected) => {
      const nodePoints = source.split('').map(c => ({ codePoint: c.codePointAt(0)! }))

      expect(eatEntityReference(nodePoints, 1, nodePoints.length)).toEqual({
        nextIndex: nodePoints.length,
        value: expected,
      })
    })

    it('Decimal numeric entity', function () {
      const nodePoints = '&#992;'.split('').map(c => ({ codePoint: c.codePointAt(0)! }))

      expect(eatEntityReference(nodePoints, 0, nodePoints.length)).toBeNull()
      expect(eatEntityReference(nodePoints, 1, nodePoints.length)).toEqual({
        nextIndex: nodePoints.length,
        value: 'Ϡ',
      })
    })

    it('hexadecimal numeric entity', function () {
      const nodePoints = '&#xcab;'.split('').map(c => ({ codePoint: c.codePointAt(0)! }))

      expect(eatEntityReference(nodePoints, 0, nodePoints.length)).toBeNull()
      expect(eatEntityReference(nodePoints, 1, nodePoints.length)).toEqual({
        nextIndex: nodePoints.length,
        value: 'ಫ',
      })
    })

    it.each(['&#;', '&#x;', '&#X;'])('rejects numeric entity without digits: %s', source => {
      const nodePoints = source.split('').map(c => ({ codePoint: c.codePointAt(0)! }))

      expect(eatEntityReference(nodePoints, 1, nodePoints.length)).toBeNull()
    })

    it.each(['&#0;', '&#x0;', '&#55296;', '&#xDFFF;', '&#1114112;', '&#x110000;'])(
      'replaces invalid Unicode scalar value in %s',
      source => {
        const nodePoints = source.split('').map(c => ({ codePoint: c.codePointAt(0)! }))

        expect(eatEntityReference(nodePoints, 1, nodePoints.length)).toEqual({
          nextIndex: nodePoints.length,
          value: '\ufffd',
        })
      },
    )

    it.each([
      ['&#55295;', 0xd7ff],
      ['&#xE000;', 0xe000],
      ['&#x10FFFF;', 0x10ffff],
    ])('preserves valid Unicode scalar boundary in %s', (source, expectedCodePoint) => {
      const nodePoints = source.split('').map(c => ({ codePoint: c.codePointAt(0)! }))

      expect(eatEntityReference(nodePoints, 1, nodePoints.length)).toEqual({
        nextIndex: nodePoints.length,
        value: String.fromCodePoint(expectedCodePoint),
      })
    })
  })
})
