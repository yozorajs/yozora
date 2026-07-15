import { ImageType } from '@yozora/ast'
import { createTokenizerTester } from '@yozora/test-util'
import ImageTokenizer from '@yozora/tokenizer-image'
import { ImageReferenceTokenizerName } from '@yozora/tokenizer-image-reference'
import { expect, test } from 'vitest'
import { parsers } from 'vitest.setup'

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

test.each([
  ['empty input', '', { line: 1, column: 1, offset: 0 }],
  ['text without a line ending', 'a', { line: 1, column: 2, offset: 1 }],
  ['LF', 'a\n', { line: 2, column: 1, offset: 2 }],
  ['CRLF', 'a\r\n', { line: 2, column: 1, offset: 3 }],
  ['blank input', '\n', { line: 2, column: 1, offset: 1 }],
  ['multiple blank lines', '\n\n', { line: 3, column: 1, offset: 2 }],
  ['trailing blank lines', 'a\r\n\r\n', { line: 3, column: 1, offset: 5 }],
  ['whitespace-only input', ' \n', { line: 2, column: 1, offset: 2 }],
  ['CRLF split across chunks', ['a\r', '\n'], { line: 2, column: 1, offset: 3 }],
])('tracks source EOF for %s', (_name, source, end) => {
  expect(parsers.gfm.parse(source).position).toEqual({
    start: { line: 1, column: 1, offset: 0 },
    end,
  })
})

test('does not apply pending positions to a new sibling at the same depth', () => {
  const ast = parsers.gfm.parse('> first\n> continued\n>\n> ---')
  const blockquote = ast.children[0]

  expect(blockquote).toMatchObject({
    type: 'blockquote',
    position: { end: { line: 4, column: 6, offset: 27 } },
    children: [
      {
        type: 'paragraph',
        position: { end: { line: 2, column: 13, offset: 20 } },
      },
      {
        type: 'thematicBreak',
        position: {
          start: { line: 4, column: 3, offset: 24 },
          end: { line: 4, column: 6, offset: 27 },
        },
      },
    ],
  })
})

test('preserves positions of open states transferred by rollback', () => {
  const ast = parsers.gfm.parse('> [foo]:\n> /url\n> invalid title\n> tail')
  const blockquote = ast.children[0]

  expect(blockquote).toMatchObject({
    type: 'blockquote',
    position: { end: { line: 4, column: 7, offset: 38 } },
    children: [
      {
        type: 'definition',
        position: {
          start: { line: 1, column: 3, offset: 2 },
          end: { line: 2, column: 8, offset: 16 },
        },
      },
      {
        type: 'paragraph',
        position: {
          start: { line: 3, column: 3, offset: 18 },
          end: { line: 4, column: 7, offset: 38 },
        },
        children: [{ type: 'text', value: 'invalid title\ntail' }],
      },
    ],
  })
})

test('parses 10,000 nested block quotes without recursive stack growth', () => {
  const depth = 10_000
  const endOffset = depth + 2
  const ast = parsers.gfm.parse(`${'>'.repeat(depth)} x`)
  let node: any = ast.children[0]
  let middleNode: any

  const outerNode = node
  for (let i = 0; i < depth; ++i) {
    if (i === depth / 2) middleNode = node
    node = node.children[0]
  }

  expect(node).toMatchObject({
    type: 'paragraph',
    children: [{ type: 'text', value: 'x' }],
  })
  expect([ast.position, outerNode.position, middleNode.position]).toEqual([
    {
      start: { line: 1, column: 1, offset: 0 },
      end: { line: 1, column: endOffset + 1, offset: endOffset },
    },
    {
      start: { line: 1, column: 1, offset: 0 },
      end: { line: 1, column: endOffset + 1, offset: endOffset },
    },
    {
      start: { line: 1, column: depth / 2 + 1, offset: depth / 2 },
      end: { line: 1, column: endOffset + 1, offset: endOffset },
    },
  ])
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

test('parses 10,000 nested images without recursive stack growth', () => {
  const depth = 10_000
  const ast = parsers.gfm.parse(`${'!['.repeat(depth)}x${'](/url)'.repeat(depth)}`)

  expect((ast.children[0] as any).children[0]).toMatchObject({
    type: 'image',
    url: '/url',
    alt: 'x',
  })
})

test('parses 10,000 nested emphasis nodes without recursive stack growth', () => {
  const depth = 10_000
  const endOffset = depth * 6 + 1
  const ast = parsers.gfm.parse(`${'*a '.repeat(depth)}x${' b*'.repeat(depth)}`)
  let node: any = (ast.children[0] as any).children[0]
  let middleNode: any

  const outerNode = node
  for (let i = 0; i + 1 < depth; ++i) {
    if (i === depth / 2) middleNode = node
    node = node.children[1]
  }

  expect(node).toMatchObject({
    type: 'emphasis',
    children: [{ type: 'text', value: 'a x b' }],
  })
  expect([outerNode.position, middleNode.position]).toEqual([
    {
      start: { line: 1, column: 1, offset: 0 },
      end: { line: 1, column: endOffset + 1, offset: endOffset },
    },
    {
      start: { line: 1, column: (depth / 2) * 3 + 1, offset: (depth / 2) * 3 },
      end: {
        line: 1,
        column: endOffset - (depth / 2) * 3 + 1,
        offset: endOffset - (depth / 2) * 3,
      },
    },
  ])
})

test('flattens 10,000 nested emphasis nodes in image alt text', () => {
  const depth = 10_000
  const content = `${'*a '.repeat(depth)}x${' b*'.repeat(depth)}`
  const ast = parsers.gfm.parse(`![${content}](/url)`)

  expect((ast.children[0] as any).children[0]).toMatchObject({
    type: 'image',
    url: '/url',
    alt: `${'a '.repeat(depth)}x${' b'.repeat(depth)}`,
  })
})
