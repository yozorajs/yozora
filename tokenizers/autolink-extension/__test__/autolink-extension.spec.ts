import { createNodePointGenerator } from '@yozora/character'
import { createTokenizerTesters } from '@yozora/test-util'
import { parsers, scanGfmFixtures } from 'vitest.setup'
import AutolinkExtensionTokenizer from '../src'

createTokenizerTesters(
  parsers.gfm.useTokenizer(new AutolinkExtensionTokenizer()),
  parsers.gfmEx,
  parsers.yozora,
).forEach(tester => {
  scanGfmFixtures(scanGfmFixtures(tester, { includeGroups: ['autolink-extension'] }), {
    includeGroups: ['autolink'],
    excludeExamples: ['#617', '#620', '#621'],
  }).runTest()
})

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

  test.each(['(', '*', '~'])(
    'recognizes a valid www autolink after an invalid candidate and %s',
    boundary => {
      const prefix = `www.foo_bar.com${boundary}`
      const value = 'www.good.com'
      expect(
        parsers.gfmEx.parse(prefix + value, { shouldReservePosition: false }).children[0],
      ).toEqual({
        type: 'paragraph',
        children: [
          { type: 'text', value: prefix },
          { type: 'link', url: `http://${value}`, children: [{ type: 'text', value }] },
        ],
      })
    },
  )

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

describe('extended protocol autolinks', () => {
  test.each([
    ['mailto:foo@bar.baz', 'mailto:foo@bar.baz'],
    ['xmpp:foo@bar.baz', 'xmpp:foo@bar.baz'],
    ['xmpp:foo@bar.baz/txt@bin.com', 'xmpp:foo@bar.baz/txt@bin.com'],
  ])('recognizes %s', (source, url) => {
    expect(parsers.gfmEx.parse(source, { shouldReservePosition: false }).children[0]).toEqual({
      type: 'paragraph',
      children: [{ type: 'link', url, children: [{ type: 'text', value: source }] }],
    })
  })

  test('recognizes a protocol after whitespace within a text node', () => {
    expect(
      parsers.gfmEx.parse('prefix mailto:foo@bar.baz', { shouldReservePosition: false })
        .children[0],
    ).toEqual({
      type: 'paragraph',
      children: [
        { type: 'text', value: 'prefix ' },
        {
          type: 'link',
          url: 'mailto:foo@bar.baz',
          children: [{ type: 'text', value: 'mailto:foo@bar.baz' }],
        },
      ],
    })
  })

  test('does not override an explicit link whose label starts with a protocol', () => {
    expect(
      parsers.gfmEx.parse('[mailto:foo@bar.baz](https://example.com)', {
        shouldReservePosition: false,
      }).children[0],
    ).toEqual({
      type: 'paragraph',
      children: [
        {
          type: 'link',
          url: 'https://example.com',
          children: [{ type: 'text', value: 'mailto:foo@bar.baz' }],
        },
      ],
    })
  })

  test.each(['mailto:a.b-c_d@a.b-', 'mailto:a.b-c_d@a.b_'])(
    'does not recognize an email suffix inside invalid %s',
    source => {
      expect(parsers.gfmEx.parse(source, { shouldReservePosition: false }).children[0]).toEqual({
        type: 'paragraph',
        children: [{ type: 'text', value: source }],
      })
    },
  )

  test('keeps trailing mailto punctuation outside the link', () => {
    expect(
      parsers.gfmEx.parse('mailto:a.b-c_d@a.b./', { shouldReservePosition: false }).children[0],
    ).toEqual({
      type: 'paragraph',
      children: [
        {
          type: 'link',
          url: 'mailto:a.b-c_d@a.b',
          children: [{ type: 'text', value: 'mailto:a.b-c_d@a.b' }],
        },
        { type: 'text', value: './' },
      ],
    })
  })

  test('limits an XMPP resource to one slash', () => {
    expect(
      parsers.gfmEx.parse('xmpp:foo@bar.baz/txt/bin', { shouldReservePosition: false }).children[0],
    ).toEqual({
      type: 'paragraph',
      children: [
        {
          type: 'link',
          url: 'xmpp:foo@bar.baz/txt',
          children: [{ type: 'text', value: 'xmpp:foo@bar.baz/txt' }],
        },
        { type: 'text', value: '/bin' },
      ],
    })
  })
})

test.each([
  ['email local-part', '_a'.repeat(2_000)],
  ['www domain', '_www.'.repeat(1_000)],
  ['protocol URL domain', 'http://foo_bar.com('.repeat(1_000)],
])('does not rescan rejected %s candidates', (_, source) => {
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
})
