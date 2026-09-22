import type { Root } from '@yozora/ast'
import GfmExMarkupWeaver, { DefaultMarkupWeaver } from '@yozora/markup-gfm-ex'
import GfmExParser from '@yozora/parser-gfm-ex'
import { expect, test } from 'vitest'

test('exports the GFM Ex default under both import styles', () => {
  expect(DefaultMarkupWeaver).toBe(GfmExMarkupWeaver)
})

test.each(['~~deleted~~', '| a | b |\n| --- | --- |\n| c | d |', '- [x] completed'])(
  'round-trips a GFM extension: %s',
  source => {
    const parser = new GfmExParser()
    const ast = parser.parse(source)
    expect(parser.parse(new GfmExMarkupWeaver().weave(ast))).toEqual(ast)
  },
)

test('requires a Yozora weaver for block math', () => {
  const ast = { type: 'root', children: [{ type: 'math', value: 'x' }] } as unknown as Root
  expect(() => new GfmExMarkupWeaver().weave(ast)).toThrow('Cannot recognize node type(math)')
})
