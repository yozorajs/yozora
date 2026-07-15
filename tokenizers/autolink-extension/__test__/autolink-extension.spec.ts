import { createTokenizerTesters } from '@yozora/test-util'
import { parsers } from 'vitest.setup'
import AutolinkExtensionTokenizer from '../src'

createTokenizerTesters(
  parsers.gfm.useTokenizer(new AutolinkExtensionTokenizer()),
  parsers.gfmEx,
  parsers.yozora,
).forEach(tester =>
  tester
    .scan('gfm/autolink-extension')
    .scan([
      'gfm/autolink',
      '!gfm/autolink/#616.json',
      '!gfm/autolink/#619.json',
      '!gfm/autolink/#620.json',
    ])
    .runTest(),
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
})

describe('extended email boundaries', () => {
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
