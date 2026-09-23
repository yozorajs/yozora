import type { Root } from '@yozora/ast'
import { parsers, weavers } from 'vitest.setup'

const createAst = (tail: string): Root =>
  ({
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [
          { type: 'text', value: 'foo' },
          { type: 'break' },
          { type: 'text', value: tail },
        ],
      },
    ],
  }) as unknown as Root

test('weaves a hard break with its line ending', () => {
  const ast = createAst('bar')
  const markup = weavers.gfm.weave(ast)
  expect(markup).toBe('foo\\\nbar')
  expect(parsers.gfm.parse(markup, { shouldReservePosition: false })).toEqual(ast)
})

describe.each(['gfm', 'gfmEx', 'yozora'] as const)('%s legacy hard breaks', flavor => {
  test.each(['\n', '\r', '\r\n'])('preserves the legacy line ending %j', lineEnding => {
    const markup = weavers[flavor].weave(createAst(`${lineEnding}bar`))
    expect(markup).toBe('foo\\\nbar')
    expect(parsers[flavor].parse(markup, { shouldReservePosition: false })).toEqual(
      createAst('bar'),
    )
  })
})

test.each([
  ['- bar', '\\- bar'],
  ['* bar', '\\* bar'],
  ['+ bar', '\\+ bar'],
  ['---', '\\---'],
  ['___', '\\_\\_\\_'],
  ['***', '\\*\\*\\*'],
  ['1. bar', '1\\. bar'],
  ['2) bar', '2\\) bar'],
])('escapes a block marker after a hard break: %s', (tail, expected) => {
  const ast = createAst(tail)
  const markup = weavers.gfm.weave(ast)
  expect(markup).toBe(`foo\\\n${expected}`)
  expect(parsers.gfm.parse(markup, { shouldReservePosition: false })).toEqual(ast)
})
