import { createTokenizerTesters } from '@yozora/test-util'
import { expect, test } from 'vitest'
import { parsers, scanGfmFixtures } from 'vitest.setup'

createTokenizerTesters(parsers.gfm, parsers.gfmEx, parsers.yozora).forEach(tester => {
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
  ['consecutive line breaks', 'foo \t&#10; \t&#10;\t bar', 'foo\n\nbar'],
  ['mixed line breaks', 'foo&#10;bar &#10; baz&#10;qux', 'foo\nbar\nbaz\nqux'],
  ['boundary line breaks', '&#10; \tfoo \t&#10;', '\nfoo\n'],
  ['internal whitespace', 'foo \t bar &#10; baz \t qux', 'foo \t bar\nbaz \t qux'],
  ['token boundaries', '&#32;foo&#10;bar&#32;', ' foo\nbar '],
  ['Unicode whitespace boundaries', 'foo \u00a0&#10;\u00a0 bar', 'foo \u00a0\n\u00a0 bar'],
])('preserves text semantics around %s', function (_, source, value) {
  const ast = parsers.gfm.parse(source, { shouldReservePosition: false })

  expect(ast.children).toEqual([{ type: 'paragraph', children: [{ type: 'text', value }] }])
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
