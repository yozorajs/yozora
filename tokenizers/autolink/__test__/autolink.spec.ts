import { createTokenizerTester, createTokenizerTesters } from '@yozora/test-util'
import { parsers, scanGfmFixtures } from 'vitest.setup'

scanGfmFixtures(createTokenizerTester(parsers.gfm), {
  includeGroups: ['autolink'],
}).runTest()

createTokenizerTesters(parsers.gfmEx, parsers.yozora).forEach(tester =>
  scanGfmFixtures(tester, {
    includeGroups: ['autolink'],
    excludeExamples: ['#616', '#619', '#620'],
  }).runTest(),
)

describe('URI autolinks with non-ASCII characters', () => {
  test.each([
    ['<https://example.com/路径>', 'https://example.com/%E8%B7%AF%E5%BE%84'],
    ['<foo:😀>', 'foo:%F0%9F%98%80'],
  ])('recognizes %s', (source, url) => {
    expect(parsers.gfm.parse(source).children[0]).toMatchObject({
      type: 'paragraph',
      children: [
        {
          type: 'link',
          url,
          children: [{ type: 'text', value: source.slice(1, -1) }],
        },
      ],
    })
  })
})

test('preserves backslashes in an autolink label', () => {
  expect(parsers.gfm.parse('<foo:a\\*b>').children[0]).toMatchObject({
    type: 'paragraph',
    children: [
      {
        type: 'link',
        url: 'foo:a%5C*b',
        children: [{ type: 'text', value: 'foo:a\\*b' }],
      },
    ],
  })
})
