import { createTokenizerTesters } from '@yozora/test-util'
import { expect, test } from 'vitest'
import { parsers, scanGfmFixtures } from 'vitest.setup'
import DeleteTokenizer from '../src'

createTokenizerTesters(
  parsers.gfm.useTokenizer(new DeleteTokenizer()),
  parsers.gfmEx,
  parsers.yozora,
).forEach(tester => {
  scanGfmFixtures(tester, { includeGroups: ['delete'] }).runTest()
})

test('delete node should omit position when shouldReservePosition is false', function () {
  const parser = parsers.gfm.useTokenizer(new DeleteTokenizer())
  const ast = parser.parse('~~deleted~~', { shouldReservePosition: false })
  const node = (ast.children[0] as any).children[0]

  expect(node.type).toBe('delete')
  expect(node.position).toBeUndefined()
})

test.each([
  ['~deleted~', [{ type: 'delete', children: [{ type: 'text', value: 'deleted' }] }]],
  ['~~deleted~~', [{ type: 'delete', children: [{ type: 'text', value: 'deleted' }] }]],
  ['This will ~~~not~~~ strike.', [{ type: 'text', value: 'This will ~~~not~~~ strike.' }]],
  ['~not deleted~~', [{ type: 'text', value: '~not deleted~~' }]],
  ['~~not deleted~', [{ type: 'text', value: '~~not deleted~' }]],
])('parses matching one-or-two-tilde delimiters in %s', (input, children) => {
  const parser = parsers.gfm.useTokenizer(new DeleteTokenizer())
  const ast = parser.parse(input, { shouldReservePosition: false })

  expect((ast.children[0] as any).children).toEqual(children)
})

test('supports current GFM example 491', () => {
  const ast = parsers.gfmEx.parse('~~Hi~~ Hello, ~there~ world!', {
    shouldReservePosition: false,
  })

  expect((ast.children[0] as any).children).toEqual([
    { type: 'delete', children: [{ type: 'text', value: 'Hi' }] },
    { type: 'text', value: ' Hello, ' },
    { type: 'delete', children: [{ type: 'text', value: 'there' }] },
    { type: 'text', value: ' world!' },
  ])
})
