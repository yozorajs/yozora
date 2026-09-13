import type { List } from '@yozora/ast'
import { createTokenizerTester, createTokenizerTesters } from '@yozora/test-util'
import { expect, test } from 'vitest'
import { parsers, scanGfmFixtures } from 'vitest.setup'

scanGfmFixtures(createTokenizerTester(parsers.gfm), {
  includeGroups: ['list', 'list-item'],
  excludeGroups: ['list-item/task list items(extension)'],
}).runTest()

createTokenizerTesters(parsers.gfmEx, parsers.yozora).forEach(tester => {
  scanGfmFixtures(tester, { includeGroups: ['list', 'list-item'] })
    .scan('custom/list')
    .runTest()
})

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

test.each(['# heading', '> quote', '- child', '1. child', '---', '```js', '[ref]: /url'])(
  'keeps %s after a task marker as paragraph content',
  content => {
    const list = parsers.yozora.parse(`- [x] ${content}`, {
      shouldReservePosition: false,
    }).children[0] as List

    expect(list.children[0]).toEqual({
      type: 'listItem',
      status: 'done',
      children: [{ type: 'text', value: content }],
    })
  },
)

test.each([
  ['-     [x] foo', '[x] foo\n'],
  ['-\t\t[x] foo', '  [x] foo\n'],
  ['1.     [x] foo', '[x] foo\n'],
])('preserves task-like text in indented code: %s', (source, value) => {
  const list = parsers.yozora.parse(source, { shouldReservePosition: false }).children[0] as List

  expect(list.children[0].status).toBeUndefined()
  expect(list.children[0].children).toMatchObject([{ type: 'code', value }])
})

test('does not recognize a task marker in a setext heading', () => {
  const list = parsers.yozora.parse('- [x] heading\n  ---', {
    shouldReservePosition: false,
  }).children[0] as List

  expect(list.children[0].status).toBeUndefined()
  expect(list.children[0].children).toEqual([
    { type: 'heading', depth: 2, children: [{ type: 'text', value: '[x] heading' }] },
  ])
})

test('recognizes the first paragraph after an empty list opening line', () => {
  const list = parsers.yozora.parse('-\n  [x] task', {
    shouldReservePosition: false,
  }).children[0] as List

  expect(list.children[0]).toEqual({
    type: 'listItem',
    status: 'done',
    children: [{ type: 'text', value: 'task' }],
  })
})

test('leaves task-like text in later paragraphs unchanged', () => {
  const list = parsers.yozora.parse('- # heading\n\n  [x] later', {
    shouldReservePosition: false,
  }).children[0] as List

  expect(list.children[0].status).toBeUndefined()
  expect(list.children[0].children[1]).toEqual({
    type: 'paragraph',
    children: [{ type: 'text', value: '[x] later' }],
  })
})

test.each(['- [x] ', '- [x]\n', '- [x]\n  task', '- [x]\n\n  task'])(
  'handles an empty task opening line in %j',
  source => {
    const list = parsers.yozora.parse(source, {
      shouldReservePosition: false,
    }).children[0] as List

    expect(list.children[0].status).toBe('done')
    expect(list.children[0].children).toEqual(
      source.includes('task') ? [{ type: 'text', value: 'task' }] : [],
    )
  },
)

test('requires whitespace after a task marker', () => {
  const list = parsers.yozora.parse('- [x]', {
    shouldReservePosition: false,
  }).children[0] as List

  expect(list.children[0].status).toBeUndefined()
  expect(list.children[0].children).toEqual([{ type: 'text', value: '[x]' }])
})
