import { createTokenizerTester } from '@yozora/test-util'
import { expect, test } from 'vitest'
import { parsers } from 'vitest.setup'

createTokenizerTester(parsers.gfm)
  .scan([
    'gfm/**/*.json',
    '!gfm/autolink-extension/**/*',
    '!gfm/delete/**/*',
    '!gfm/list-item/task list items\\(extension\\)/**/*',
    '!gfm/table/**/*',
  ])
  .runTest()

test('parses chunked input independently of chunk boundaries', () => {
  const content = 'a\r\nb😀c'

  expect(parsers.gfm.parse(content.split(''))).toEqual(parsers.gfm.parse(content))
})

test.each([
  ['ATX heading', '# bar', 'heading'],
  ['thematic break', '***', 'thematicBreak'],
  ['block quote', '> bar', 'blockquote'],
  ['list', '- bar', 'list'],
])('recognizes %s after partial-tab indentation', (_name, source, nodeType) => {
  const ast = parsers.gfm.parse(`1234. foo\n\t  \t${source}`)
  const listItem = (ast.children[0] as any).children[0]

  expect(listItem.children[1].type).toBe(nodeType)
})

test('recognizes an HTML block after partial-tab indentation', () => {
  const ast = parsers.gfm.parse('1234. foo\n\n\t  \t<div>bar</div>')
  const listItem = (ast.children[0] as any).children[0]

  expect(listItem.children[1].type).toBe('html')
})

test('recognizes a link definition after partial-tab indentation', () => {
  const ast = parsers.gfm.parse('1234. foo\n\n\t  \t[a]: /url\n\n[a]')
  const listItem = (ast.children[0] as any).children[0]

  expect(listItem.children[1]).toMatchObject({ type: 'definition', url: '/url' })
  expect(ast.children.at(-1)).toMatchObject({ children: [{ type: 'linkReference' }] })
})

test('recognizes a setext heading after partial-tab indentation', () => {
  const ast = parsers.gfm.parse('1234. foo\n\n\t  bar\n\t  \t---')
  const listItem = (ast.children[0] as any).children[0]

  expect(listItem.children[1]).toMatchObject({ type: 'heading', depth: 2 })
})
