import invariant from '../src'

describe('development', function () {
  test('truthy', function () {
    expect(() => void invariant(false, 'waw')).toThrow('Invariant failed: waw')
    expect(() => void invariant(false, () => 'waw')).toThrow(
      'Invariant failed: waw',
    )
    expect(() => void invariant(false)).toThrow('Invariant failed: ')
  })

  test('falsy', function () {
    expect(() => void invariant(true, 'waw')).not.toThrow()
    expect(() => void invariant(true)).not.toThrow()
  })
})
