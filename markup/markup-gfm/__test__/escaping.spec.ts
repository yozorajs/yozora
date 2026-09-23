import type { Root } from '@yozora/ast'
import { parsers, weavers } from 'vitest.setup'

test('preserves literal backslashes in plain text', () => {
  const ast = {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [{ type: 'text', value: '\\]\\*\\a' }],
      },
    ],
  } as unknown as Root

  const markup = weavers.gfm.weave(ast)
  expect(markup).toBe('\\\\]\\\\\\*\\a')
  expect(parsers.gfm.parse(markup, { shouldReservePosition: false })).toEqual(ast)
})

describe.each(['gfm', 'gfmEx', 'yozora'] as const)('%s literal text', flavor => {
  test.each([
    '*literal* [label](url) `code` <br> &copy;!',
    'foo\n\nbar',
    '\tfoo',
    '\\\tfoo',
    '<foo+@bar.example.com>',
    'a.b-c_d@a.b_',
    '1. item',
    '+ item',
  ])('preserves text without introducing Markdown structure: %j', value => {
    const ast = {
      type: 'root',
      children: [{ type: 'paragraph', children: [{ type: 'text', value }] }],
    } as unknown as Root
    const parser = parsers[flavor]
    const weaver = weavers[flavor]
    const markup = weaver.weave(ast)
    const reparsed = parser.parse(markup, { shouldReservePosition: false })
    expect(reparsed).toEqual(ast)
    expect(weaver.weave(reparsed)).toBe(markup)
  })

  test.each([
    ['<', '<'],
    ['1 < 2', '1 < 2'],
    ['<33>', '<33>'],
    ['<br>', '\\<br>'],
    ['</div>', '\\</div>'],
    ['<foo:bar>', '\\<foo:bar>'],
    ['\\<br>', '\\\\\\<br>'],
  ])('uses Markdown escaping for angle brackets in %j', (value, expected) => {
    const ast = {
      type: 'root',
      children: [{ type: 'paragraph', children: [{ type: 'text', value }] }],
    } as unknown as Root
    const markup = weavers[flavor].weave(ast)
    expect(markup).toBe(expected)
    expect(parsers[flavor].parse(markup, { shouldReservePosition: false })).toEqual(ast)
  })

  test.each(['- bar', '+ bar', '* bar', '1. bar'])(
    'preserves link and image reference labels starting with %j',
    label => {
      for (const prefix of ['', '!']) {
        const source = `${prefix}[foo][${label}]\n\n[${label}]: /url`
        const parser = parsers[flavor]
        const ast = parser.parse(source, { shouldReservePosition: false })
        expect(ast.children[0]).toMatchObject({
          children: [{ type: prefix ? 'imageReference' : 'linkReference' }],
        })
        const markup = weavers[flavor].weave(ast)
        expect(markup).toContain(`[${label}]: /url`)
        expect(parser.parse(markup, { shouldReservePosition: false })).toEqual(ast)
      }
    },
  )
})

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

  const markup = weavers.gfm.weave(ast)
  expect(parsers.gfm.parse(markup, { shouldReservePosition: false })).toEqual(ast)
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

  const markup = weavers.gfm.weave(ast)
  expect(markup).toBe('*before _\\*inner\\*_\\*x\\**')
  expect(parsers.gfm.parse(markup, { shouldReservePosition: false })).toEqual(ast)
})
