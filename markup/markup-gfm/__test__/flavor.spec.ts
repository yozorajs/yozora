import type { Root } from '@yozora/ast'
import GfmMarkupWeaver, { DefaultMarkupWeaver } from '@yozora/markup-gfm'
import GfmParser from '@yozora/parser-gfm'
import { expect, test } from 'vitest'

test('exports the GFM default under both import styles', () => {
  expect(DefaultMarkupWeaver).toBe(GfmMarkupWeaver)
})

test.each([
  ['mailto:foo@bar.baz', '[mailto:foo&#64;bar.baz](mailto:foo@bar.baz)'],
  ['xmpp:foo@bar.baz/txt', '[xmpp:foo&#64;bar.baz/txt](xmpp:foo@bar.baz/txt)'],
])('preserves a protocol link without requiring autolink extensions: %s', (url, expected) => {
  const parser = new GfmParser()
  const ast = parser.parse(`[${url}](${url})`)
  const markup = new GfmMarkupWeaver().weave(ast)
  expect(markup).toBe(expected)
  expect(parser.parse(markup)).toEqual(ast)
})

test('requires an extension weaver for strikethrough', () => {
  const ast = { type: 'root', children: [{ type: 'delete', children: [] }] } as unknown as Root
  expect(() => new GfmMarkupWeaver().weave(ast)).toThrow('Cannot recognize node type(delete)')
})
