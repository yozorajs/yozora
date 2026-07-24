import { createNodePointGenerator } from '@yozora/character'
import { createTokenizerTesters } from '@yozora/test-util'
import { parsers, scanGfmFixtures } from 'vitest.setup'
import AutolinkExtensionTokenizer from '../src'

createTokenizerTesters(
  parsers.gfm.useTokenizer(new AutolinkExtensionTokenizer()),
  parsers.gfmEx,
  parsers.yozora,
).forEach(tester =>
  scanGfmFixtures(scanGfmFixtures(tester, { includeGroups: ['autolink-extension'] }), {
    includeGroups: ['autolink'],
    excludeExamples: ['#617', '#620', '#621'],
  }).runTest(),
)

describe('extended URL boundaries', () => {
  test.each(['ftp://example.com', 'http://example.com/'])(
    'recognizes valid extended URL %s',
    source => {
      expect(parsers.gfmEx.parse(source).children[0]).toMatchObject({
        type: 'paragraph',
        children: [{ type: 'link', url: source }],
      })
    },
  )

  test('rejects an underscore in the final two domain segments', () => {
    const source = 'http://foo_bar.com'
    expect(parsers.gfmEx.parse(source).children[0]).toMatchObject({
      type: 'paragraph',
      children: [{ type: 'text', value: source }],
    })
  })

  test.each([
    ['aa._https://example.com', 'https://example.com'],
    ['aa._www.example.com', 'http://www.example.com'],
  ])('recognizes %s after an underscore delimiter', (source, url) => {
    const value = source.slice(4)
    expect(parsers.gfmEx.parse(source, { shouldReservePosition: false }).children[0]).toEqual({
      type: 'paragraph',
      children: [
        { type: 'text', value: 'aa._' },
        { type: 'link', url, children: [{ type: 'text', value }] },
      ],
    })
  })
})

describe('extended email boundaries', () => {
  test.each(['+foo@bar.baz', '.foo@bar.baz', '-foo@bar.baz', '_foo@bar.baz', 'foo@bar.baz'])(
    'allows a valid local-part first character in %s',
    source => {
      expect(parsers.gfmEx.parse(source).children[0]).toMatchObject({
        type: 'paragraph',
        children: [{ type: 'link', url: `mailto:${source}` }],
      })
    },
  )

  test.each(['foo@bar..baz', 'foo@bar...'])('rejects an empty domain segment in %s', source => {
    expect(parsers.gfmEx.parse(source).children[0]).toMatchObject({
      type: 'paragraph',
      children: [{ type: 'text', value: source }],
    })
  })

  test('keeps a trailing period outside a valid email', () => {
    expect(parsers.gfmEx.parse('foo@bar.baz.').children[0]).toMatchObject({
      type: 'paragraph',
      children: [
        { type: 'link', url: 'mailto:foo@bar.baz' },
        { type: 'text', value: '.' },
      ],
    })
  })
})

test.each(['_a'.repeat(2_000), '_www.'.repeat(1_000)])(
  'does not rescan rejected underscore-prefixed candidates',
  source => {
    const originalNodePoints = Array.from(createNodePointGenerator(source)).flat()
    let nodePointReads = 0
    const nodePoints = new Proxy(originalNodePoints, {
      get: (target, property, receiver) => {
        if (typeof property === 'string' && Number.isInteger(Number(property))) {
          nodePointReads += 1
        }
        return Reflect.get(target, property, receiver)
      },
    })
    const hook = new AutolinkExtensionTokenizer().match({
      getBlockStartIndex: () => 0,
      getNodePoints: () => nodePoints,
    } as any)
    const findDelimiter = hook.findDelimiter()
    findDelimiter.next()

    expect(findDelimiter.next([0, nodePoints.length]).value).toBeNull()
    expect(nodePointReads).toBeLessThan(nodePoints.length * 64)
    expect(parsers.gfmEx.parse(source, { shouldReservePosition: false })).toEqual({
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'text', value: source }],
        },
      ],
    })
  },
)
