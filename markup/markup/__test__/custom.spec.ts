import type { Root } from '@yozora/ast'
import { MarkupWeaver, ParagraphWeaver, RootWeaver, TextWeaver } from '@yozora/markup'

const ast = {
  type: 'root',
  children: [{ type: 'paragraph', children: [{ type: 'text', value: '# Heading' }] }],
} as unknown as Root

test('requires explicit node registration', () => {
  const weaver = new MarkupWeaver()
  expect(() => weaver.weave(ast)).toThrow('Cannot recognize node type(paragraph)')

  weaver.useWeaver(new RootWeaver()).useWeaver(new ParagraphWeaver()).useWeaver(new TextWeaver())
  expect(weaver.weave(ast)).toBe('\\# Heading')
})
