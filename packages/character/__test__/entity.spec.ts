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
  })
})
