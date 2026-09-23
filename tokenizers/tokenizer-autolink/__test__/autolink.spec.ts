import { parsers, scanGfmFixtures } from 'vitest.setup'
import { createTokenizerTester, createTokenizerTesters } from '../../../script/test/index.mjs'

scanGfmFixtures(createTokenizerTester('gfm', parsers.gfm), {
  includeGroups: ['autolink'],
}).runTest()

createTokenizerTesters(['gfm-ex', parsers.gfmEx], ['yozora', parsers.yozora]).forEach(tester => {
  scanGfmFixtures(tester, {
    includeGroups: ['autolink'],
  }).runTest()
})

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

describe('escaped autolink openers', () => {
  test.each(['<foo:bar>', '<foo+@bar.example.com>'])(
    'respects backslash parity before %s',
    source => {
      for (const count of [1, 2, 3, 4]) {
        const ast = parsers.gfm.parse('\\'.repeat(count) + source, {
          shouldReservePosition: false,
        })
        if (count % 2 === 1) {
          expect(ast.children[0]).toEqual({
            type: 'paragraph',
            children: [{ type: 'text', value: '\\'.repeat((count - 1) / 2) + source }],
          })
        } else {
          expect(ast.children[0]).toMatchObject({
            type: 'paragraph',
            children: [{ type: 'text', value: '\\'.repeat(count / 2) }, { type: 'link' }],
          })
        }
      }
    },
  )
})
