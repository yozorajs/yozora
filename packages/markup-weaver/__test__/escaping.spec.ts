import type { Root } from '@yozora/ast'
import { parsers, weavers } from 'vitest.setup'

test('preserves a literal backslash before a nested inline delimiter', () => {
  const ast = {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [
          {
            type: 'link',
            url: '/target',
            children: [
              {
                type: 'emphasis',
                children: [{ type: 'text', value: '\\*' }],
              },
            ],
          },
        ],
      },
    ],
  } as unknown as Root

  const markup = weavers.yozora.weave(ast)
  expect(parsers.yozora.parse(markup, { shouldReservePosition: false })).toEqual(ast)
})

test('keeps an outer escaper active after a nested node of the same type', () => {
  const ast = {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [
          {
            type: 'emphasis',
            children: [
              { type: 'text', value: 'before ' },
              {
                type: 'emphasis',
                children: [{ type: 'text', value: '*inner*' }],
              },
              { type: 'text', value: '*x*' },
            ],
          },
        ],
      },
    ],
  } as unknown as Root

  const markup = weavers.yozora.weave(ast)
  expect(markup).toBe('*before _\\*inner\\*_\\*x\\**')
  expect(parsers.yozora.parse(markup, { shouldReservePosition: false })).toEqual(ast)
})
