import { createTokenizerTester, createTokenizerTesters } from '@yozora/test-util'
import { expect, test } from 'vitest'
import { parsers } from 'vitest.setup'

createTokenizerTester(parsers.gfm)
  .scan(['gfm/list', 'gfm/list-item', '!gfm/list-item/task list items\\(extension\\)/**/*'])
  .runTest()

createTokenizerTesters(parsers.gfmEx, parsers.yozora).forEach(tester =>
  tester.scan(['gfm/list', 'gfm/list-item', 'custom/list']).runTest(),
)

for (let spaceCount = 1; spaceCount <= 3; ++spaceCount) {
  test(`handles ${spaceCount}-space tab indentation in list items`, () => {
    const indent = ' '.repeat(spaceCount) + '\t\t'

    expect(parsers.gfm.parse(`- foo\n\n${indent}bar`)).toMatchObject({
      children: [
        {
          type: 'list',
          children: [
            {
              children: [
                { type: 'paragraph', children: [{ type: 'text', value: 'foo' }] },
                { type: 'code', value: '  bar\n' },
              ],
            },
          ],
        },
      ],
    })
  })
}

test('matches list continuation indentation by columns', () => {
  expect(parsers.gfm.parse('123. foo\n\n  \tbar')).toMatchObject({
    children: [
      {
        type: 'list',
        children: [{ children: [{ type: 'text', value: 'foo' }] }],
      },
      { type: 'code', value: 'bar\n' },
    ],
  })
})

test('tracks tab columns across nested containers', () => {
  expect(parsers.gfm.parse('> - foo\n>\n>  \t\tbar')).toMatchObject({
    children: [
      {
        type: 'blockquote',
        children: [
          {
            type: 'list',
            children: [
              {
                children: [
                  { type: 'paragraph', children: [{ type: 'text', value: 'foo' }] },
                  { type: 'code', value: 'bar\n' },
                ],
              },
            ],
          },
        ],
      },
    ],
  })
})

test('preserves tabs left untouched by list indentation', () => {
  expect(parsers.gfm.parse('1234. ```\n\t  \tX\n      ```')).toMatchObject({
    children: [
      {
        type: 'list',
        children: [{ children: [{ type: 'code', value: '\tX\n' }] }],
      },
    ],
  })
})
