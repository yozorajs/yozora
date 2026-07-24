import { createTokenizerTester, createTokenizerTesters } from '@yozora/test-util'
import { expect, test } from 'vitest'
import { parsers, scanGfmFixtures } from 'vitest.setup'

scanGfmFixtures(createTokenizerTester(parsers.gfm), {
  includeGroups: ['list', 'list-item'],
  excludeGroups: ['list-item/task list items(extension)'],
}).runTest()

createTokenizerTesters(parsers.gfmEx, parsers.yozora).forEach(tester =>
  scanGfmFixtures(tester, { includeGroups: ['list', 'list-item'] })
    .scan('custom/list')
    .runTest(),
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

for (const [indentWidth, initialIndent] of ['', ' ', '  ', '   '].entries()) {
  test(`handles tabs after a list marker with ${indentWidth}-column indentation`, () => {
    const expectedIndent = ['  ', ' ', '', '   '][indentWidth]
    const ast = parsers.gfm.parse(`${initialIndent}-\t\tfoo`)

    expect(ast).toMatchObject({
      children: [
        {
          type: 'list',
          children: [{ children: [{ type: 'code', value: `${expectedIndent}foo\n` }] }],
        },
      ],
    })
  })
}

for (const [indentWidth, initialIndent] of ['', ' ', '  ', '   '].entries()) {
  test(`does not interrupt a paragraph with a ${indentWidth}-column indented empty item`, () => {
    expect(parsers.gfm.parse(`foo\n${initialIndent}+\t`)).toMatchObject({
      children: [{ type: 'paragraph', children: [{ type: 'text', value: 'foo\n+' }] }],
    })
  })
}

test('interrupts a paragraph with a task-like non-empty item', () => {
  expect(parsers.gfm.parse('foo\n- [ ]')).toMatchObject({
    children: [{ type: 'paragraph' }, { type: 'list' }],
  })
})

test.each([
  ['five spaces', '     '],
  ['one tab', '\t'],
  ['two tabs', '\t\t'],
])('consumes %s after a task list marker', (_, whitespace) => {
  expect(parsers.yozora.parse(`- [ ]${whitespace}foo`)).toMatchObject({
    children: [
      {
        type: 'list',
        children: [
          {
            type: 'listItem',
            status: 'todo',
            children: [{ type: 'text', value: 'foo' }],
          },
        ],
      },
    ],
  })
})

test.each([
  ['continuation', '- [ ]     foo\n  bar', [{ type: 'text', value: 'foo\nbar' }]],
  ['nested list', '- [ ]     parent\n  - child', [{ type: 'text' }, { type: 'list' }]],
  [
    'indented code',
    '- [ ]     foo\n\n      code',
    [{ type: 'paragraph' }, { type: 'code', value: 'code\n' }],
  ],
])('keeps %s aligned to the list indentation', (_, input, children) => {
  expect(parsers.yozora.parse(input)).toMatchObject({
    children: [
      {
        type: 'list',
        children: [
          {
            type: 'listItem',
            status: 'todo',
            children,
          },
        ],
      },
    ],
  })
})
