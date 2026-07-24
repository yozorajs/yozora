import { createTokenizerTesters } from '@yozora/test-util'
import { expect, test } from 'vitest'
import { parsers, scanGfmFixtures } from 'vitest.setup'

createTokenizerTesters(parsers.gfm, parsers.gfmEx, parsers.yozora).forEach(tester =>
  scanGfmFixtures(tester, { includeGroups: ['text'] }).runTest(),
)

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
