import { ImageType } from '@yozora/ast'
import { createTokenizerTester } from '@yozora/test-util'
import ImageTokenizer from '@yozora/tokenizer-image'
import { ImageReferenceTokenizerName } from '@yozora/tokenizer-image-reference'
import { expect, test } from 'vitest'
import { parsers } from 'vitest.setup'
import GfmParser from '../src'

class ShallowImageTokenizer extends ImageTokenizer {
  // Isolate the match phase from the independently recursive inline parse phase.
  public override readonly parse: ImageTokenizer['parse'] = () => ({
    parse: tokens => tokens.map(() => ({ type: ImageType, url: '', alt: '' })),
  })
}

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

test('tracks astral Unicode positions in UTF-16 code units', () => {
  expect(parsers.gfm.parse('😀')).toMatchObject({
    position: { start: { column: 1, offset: 0 }, end: { column: 3, offset: 2 } },
    children: [
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            position: { start: { column: 1, offset: 0 }, end: { column: 3, offset: 2 } },
            value: '😀',
          },
        ],
      },
    ],
  })
})

test('preserves tokenizer order when replacing at the same priority', () => {
  const parser = new GfmParser().replaceTokenizer(new ImageTokenizer())

  expect(parser.parse('![x](/image) [![y](/nested-image)](/link)')).toMatchObject({
    children: [
      {
        children: [
          { type: 'image', url: '/image', alt: 'x' },
          { type: 'text', value: ' ' },
          {
            type: 'link',
            url: '/link',
            children: [{ type: 'image', url: '/nested-image', alt: 'y' }],
          },
        ],
      },
    ],
  })
})

test.each([
  [
    'LF and an empty heading',
    '[\n#\n\n',
    [
      { type: 'paragraph', children: [{ type: 'text', value: '[' }] },
      { type: 'heading', depth: 1, children: [] },
    ],
  ],
  [
    'CRLF and a nonempty heading',
    '[\r\n## x\r\n\r\n',
    [
      { type: 'paragraph', children: [{ type: 'text', value: '[' }] },
      { type: 'heading', depth: 2, children: [{ type: 'text', value: 'x' }] },
    ],
  ],
  [
    'a thematic break',
    '[\n***\n\n',
    [{ type: 'paragraph', children: [{ type: 'text', value: '[' }] }, { type: 'thematicBreak' }],
  ],
])('reprocesses a failed multiline definition before %s', (_name, source, expected) => {
  const ast = parsers.gfm.parse(source)

  expect(ast.children).toMatchObject(expected)
})

test('reprocesses a failed multiline definition inside a blockquote', () => {
  const ast = parsers.gfm.parse('> [\n> #\n>\n')

  expect(ast.children[0]).toMatchObject({
    type: 'blockquote',
    children: [{ type: 'paragraph' }, { type: 'heading', depth: 1 }],
  })
})

test('matches 10,000 nested images without rescanning resolved contents', () => {
  const depth = 10_000
  const parser = parsers.gfm.replaceTokenizer(
    new ShallowImageTokenizer(),
    ImageReferenceTokenizerName,
  )
  const ast = parser.parse(`${'!['.repeat(depth)}x${'](/url)'.repeat(depth)}`)

  expect((ast.children[0] as any).children).toEqual([{ type: 'image', url: '', alt: '' }])
})
