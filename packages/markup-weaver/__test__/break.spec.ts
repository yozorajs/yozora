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
  const markup = weavers.yozora.weave(ast)
  expect(markup).toBe('foo\\\nbar')
  expect(parsers.yozora.parse(markup, { shouldReservePosition: false })).toEqual(ast)
})

test('does not duplicate a line ending from a legacy parser AST', () => {
  const markup = weavers.yozora.weave(createAst('\nbar'))
  expect(markup).toBe('foo\\\nbar')
  expect(parsers.yozora.parse(markup, { shouldReservePosition: false })).toEqual(createAst('bar'))
})

test.each(['- bar', '* bar', '+ bar', '---', '___', '***'])(
  'escapes a block marker after a hard break: %s',
  tail => {
    const ast = createAst(tail)
    const markup = weavers.yozora.weave(ast)
    expect(markup).toBe(`foo\\\n\\${tail}`)
    expect(parsers.yozora.parse(markup, { shouldReservePosition: false })).toEqual(ast)
  },
)
