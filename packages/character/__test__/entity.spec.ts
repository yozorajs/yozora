import { eatEntityReference, entityReferenceTrie, entityReferences } from '../src'

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
    it('html entity', function () {
      const nodePoints = '&nbsp;'.split('').map(c => ({ codePoint: c.codePointAt(0)! }))

      expect(eatEntityReference(nodePoints, 0, nodePoints.length)).toBeNull()
      expect(eatEntityReference(nodePoints, 1, nodePoints.length)).toEqual({
        nextIndex: nodePoints.length,
        value: ' ',
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
