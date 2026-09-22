import invariant from '../src'

describe('development', function () {
  test('truthy', function () {
    expect(() => void invariant(false, 'waw')).toThrow('Invariant failed: waw')
    expect(() => void invariant(false, () => 'waw')).toThrow('Invariant failed: waw')
    expect(() => void invariant(false)).toThrow('Invariant failed: ')
  })

  test('falsy', function () {
    expect(() => void invariant(true, 'waw')).not.toThrow()
    expect(() => void invariant(true)).not.toThrow()
  })
})

describe('production', function () {
  let productionInvariant: typeof invariant

  beforeEach(async function () {
    vi.stubEnv('NODE_ENV', 'production')
    vi.resetModules()
    productionInvariant = (await import('../src')).default
  })

  afterEach(function () {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  test.each([undefined, '', 'detail'])('throws the fixed error message for %j', function (message) {
    expect(() => void productionInvariant(false, message)).toThrow(/^Invariant failed$/)
  })

  test('does not evaluate a lazy message when the condition fails', function () {
    const message = vi.fn(() => 'detail')

    expect(() => void productionInvariant(false, message)).toThrow(/^Invariant failed$/)
    expect(message).not.toHaveBeenCalled()
  })

  test('does not throw or evaluate a lazy message when the condition holds', function () {
    const message = vi.fn(() => 'detail')

    expect(() => void productionInvariant(true, message)).not.toThrow()
    expect(message).not.toHaveBeenCalled()
  })
})
