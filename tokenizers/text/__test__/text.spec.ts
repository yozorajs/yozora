import { createTokenizerTesters } from '@yozora/test-util'
import { expect, test } from 'vitest'
import { parsers, scanGfmFixtures } from 'vitest.setup'

createTokenizerTesters(
  ['gfm', parsers.gfm],
  ['gfm-ex', parsers.gfmEx],
  ['yozora', parsers.yozora],
).forEach(tester => {
  scanGfmFixtures(tester, { includeGroups: ['text'] }).runTest()
})

test('text node should omit position when shouldReservePosition is false', function () {
  const ast = parsers.gfm.parse('foo', { shouldReservePosition: false })
  const paragraph = ast.children[0] as any
  const node = paragraph.children[0]

  expect(paragraph.type).toBe('paragraph')
  expect(paragraph.position).toBeUndefined()
  expect(node.type).toBe('text')
  expect(node.value).toBe('foo')
  expect(node.position).toBeUndefined()
})

test.each([
  ['NO-BREAK SPACE', '\u00a0'],
  ['EM SPACE', '\u2003'],
])('preserves %s around soft line breaks', function (_, whitespace) {
  const ast = parsers.gfm.parse(`foo${whitespace}\n${whitespace}bar`, {
    shouldReservePosition: false,
  })

  expect(ast.children).toEqual([
    {
      type: 'paragraph',
      children: [{ type: 'text', value: `foo${whitespace}\n${whitespace}bar` }],
    },
  ])
})

test.each([
  ['space', ' '],
  ['tab', '\t'],
])('removes ASCII %s around soft line breaks', function (_, whitespace) {
  const ast = parsers.gfm.parse(`foo${whitespace}\n${whitespace}bar`, {
    shouldReservePosition: false,
  })

  expect(ast.children).toEqual([
    {
      type: 'paragraph',
      children: [{ type: 'text', value: 'foo\nbar' }],
    },
  ])
})

test.each([
  ['consecutive line breaks', 'foo \t&#10; \t&#10;\t bar', 'foo \t\n \t\n\t bar'],
  ['mixed line breaks', 'foo&#10;bar &#10; baz&#10;qux', 'foo\nbar \n baz\nqux'],
  ['boundary line breaks', '&#10; \tfoo \t&#10;', '\n \tfoo \t\n'],
  ['internal whitespace', 'foo \t bar &#10; baz \t qux', 'foo \t bar \n baz \t qux'],
  ['token boundaries', '&#32;foo&#10;bar&#32;', ' foo\nbar '],
  ['Unicode whitespace boundaries', 'foo \u00a0&#10;\u00a0 bar', 'foo \u00a0\n\u00a0 bar'],
  ['named line breaks', 'a &NewLine; b', 'a \n b'],
  ['hexadecimal line breaks', 'a &#xA; b', 'a \n b'],
  ['encoded space before source LF', 'a&#32;\nb', 'a \nb'],
  ['encoded space after source LF', 'a\n&#32;b', 'a\n b'],
  ['encoded tabs', 'a&Tab;\n&Tab;b', 'a\t\n\tb'],
  ['mixed encoded and source spaces', 'a&#32; \n &#32;b', 'a \n b'],
  ['escaped entity syntax', String.raw`a \&#10; b`, 'a &#10; b'],
  ['single-pass entity decoding', 'a &amp;#10; b', 'a &#10; b'],
])('preserves text semantics around %s', function (_, source, value) {
  const ast = parsers.gfm.parse(source, { shouldReservePosition: false })

  expect(ast.children).toEqual([{ type: 'paragraph', children: [{ type: 'text', value }] }])
})

test.each([
  ['a  \nb', [{ type: 'text', value: 'a' }, { type: 'break' }, { type: 'text', value: 'b' }]],
  ['a\\\nb', [{ type: 'text', value: 'a' }, { type: 'break' }, { type: 'text', value: 'b' }]],
  ['a&#32;&#32;\nb', [{ type: 'text', value: 'a  \nb' }]],
  ['a&#92;\nb', [{ type: 'text', value: 'a\\\nb' }]],
  ['a&#32;  \nb', [{ type: 'text', value: 'a ' }, { type: 'break' }, { type: 'text', value: 'b' }]],
])('recognizes hard breaks from source characters in %j', (source, children) => {
  expect(parsers.gfm.parse(source, { shouldReservePosition: false }).children).toEqual([
    { type: 'paragraph', children },
  ])
})

test('preserves source positions while decoding whitespace entities', () => {
  const ast = parsers.gfm.parse('中&#32;\r\n&#32;😀', { shouldReservePosition: true })
  const node = (ast.children[0] as any).children[0]

  expect(node).toEqual({
    type: 'text',
    value: '中 \n 😀',
    position: {
      start: { line: 1, column: 1, offset: 0 },
      end: { line: 2, column: 8, offset: 15 },
    },
  })
})

test.each([
  ['', ''],
  ['before\n', 'before\n'],
  ['before \n', 'before\n'],
])('preserves a long whitespace run after %j', function (prefix, normalizedPrefix) {
  const content = `a${' \t'.repeat(32_000)}b`
  const source = prefix + content
  const ast = parsers.gfm.parse(source, { shouldReservePosition: false })

  expect(ast.children).toEqual([
    { type: 'paragraph', children: [{ type: 'text', value: normalizedPrefix + content }] },
  ])
})
