import type { Blockquote } from '@yozora/ast'
import { BlockquoteType, ImageType } from '@yozora/ast'
import type { IBlockToken, IParseBlockGenerator } from '@yozora/core-tokenizer'
import { createTokenizerTester } from '@yozora/test-util'
import BlockquoteTokenizer, { blockquoteMatch } from '@yozora/tokenizer-blockquote'
import ImageTokenizer from '@yozora/tokenizer-image'
import { ImageReferenceTokenizerName } from '@yozora/tokenizer-image-reference'
import { expect, test } from 'vitest'
import { parsers, scanGfmFixtures } from 'vitest.setup'
import GfmParser from '../src'

class ShallowImageTokenizer extends ImageTokenizer {
  // Isolate the match phase from the independently recursive inline parse phase.
  public override readonly parse: ImageTokenizer['parse'] = () => ({
    parse: tokens => tokens.map(() => ({ type: ImageType, url: '', alt: '' })),
  })
}

class TrackingBlockquoteTokenizer extends BlockquoteTokenizer {
  public readonly events: string[] = []

  public constructor(private readonly shouldRequestChildren = true) {
    super()
  }

  public override readonly parse: BlockquoteTokenizer['parse'] = api => {
    const events = this.events
    const shouldRequestChildren = this.shouldRequestChildren
    return {
      parse: function* (tokens) {
        const nodes: Blockquote[] = []
        for (const token of tokens) {
          const column = token.position.start.column
          events.push(`enter:${column}`)
          const children = shouldRequestChildren
            ? yield api.requestBlockTokens(token.children.filter(() => true))
            : []
          events.push(`exit:${column}`)
          nodes.push(
            api.shouldReservePosition
              ? { type: BlockquoteType, position: token.position, children }
              : { type: BlockquoteType, children },
          )
        }
        return nodes
      },
    }
  }
}

class CyclicBlockquoteTokenizer extends BlockquoteTokenizer {
  public override readonly match: BlockquoteTokenizer['match'] = api => {
    const hook = blockquoteMatch.call(this, api)
    return {
      ...hook,
      onClose: token => {
        token.children = [token as IBlockToken]
      },
    }
  }
}

class AsyncBlockquoteTokenizer extends BlockquoteTokenizer {
  public override readonly parse: BlockquoteTokenizer['parse'] = () => ({
    parse: () =>
      (async function* (): AsyncGenerator<never, Blockquote[]> {
        yield* []
        return []
      })() as unknown as IParseBlockGenerator<Blockquote[]>,
  })
}

class MalformedIteratorResultBlockquoteTokenizer extends BlockquoteTokenizer {
  public override readonly parse: BlockquoteTokenizer['parse'] = () => ({
    parse: () => {
      const generator = {
        [Symbol.iterator](): IParseBlockGenerator<Blockquote[]> {
          return this as unknown as IParseBlockGenerator<Blockquote[]>
        },
        next: (): null => null,
        throw: (error: unknown): never => {
          throw error
        },
      }
      return generator as unknown as IParseBlockGenerator<Blockquote[]>
    },
  })
}

class RecoveringBlockquoteTokenizer extends BlockquoteTokenizer {
  public readonly events: string[] = []

  public constructor(private readonly nestedFailure: 'iterator' | 'throw' = 'throw') {
    super()
  }

  public override readonly parse: BlockquoteTokenizer['parse'] = api => {
    const events = this.events
    const nestedFailure = this.nestedFailure
    return {
      parse: function* (tokens) {
        const nodes: Blockquote[] = []
        for (const token of tokens) {
          const column = token.position.start.column
          try {
            events.push(`enter:${column}`)
            if (column > 1) {
              if (nestedFailure === 'throw') throw new Error('nested blockquote failed')

              const invalidNodes: Blockquote[] = []
              Object.defineProperty(invalidNodes, Symbol.iterator, {
                value: () => {
                  throw new Error('nested blockquote iterator failed')
                },
              })
              return invalidNodes
            }

            const children = yield api.requestBlockTokens(token.children)
            nodes.push(
              api.shouldReservePosition
                ? { type: BlockquoteType, position: token.position, children }
                : { type: BlockquoteType, children },
            )
          } catch (error) {
            if (column > 1) throw error
            events.push(`catch:${column}`)
            nodes.push(
              api.shouldReservePosition
                ? { type: BlockquoteType, position: token.position, children: [] }
                : { type: BlockquoteType, children: [] },
            )
          } finally {
            events.push(`finally:${column}`)
          }
        }
        return nodes
      },
    }
  }
}

scanGfmFixtures(createTokenizerTester('gfm', parsers.gfm), {
  excludeGroups: ['autolink-extension', 'delete', 'list-item/task list items(extension)', 'table'],
}).runTest()

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
  ['LF', 'a\n', { line: 2, column: 1, offset: 2 }],
  ['CR', 'a\r', { line: 2, column: 1, offset: 2 }],
  ['CRLF', 'a\r\n', { line: 2, column: 1, offset: 3 }],
])('tracks positions after terminal %s line endings', (_, input, end) => {
  expect(parsers.gfm.parse(input)).toMatchObject({
    position: { end },
    children: [{ type: 'paragraph', position: { end } }],
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

test('lazily parses a filtered token array in parent-before-child order', () => {
  const tokenizer = new TrackingBlockquoteTokenizer()
  const parser = new GfmParser().replaceTokenizer(tokenizer)

  expect(parser.parse('>> x')).toMatchObject({
    children: [{ type: BlockquoteType, children: [{ type: BlockquoteType }] }],
  })
  expect(tokenizer.events).toEqual(['enter:1', 'enter:2', 'exit:2', 'exit:1'])
})

test('does not parse block children that a parent hook does not request', () => {
  const tokenizer = new TrackingBlockquoteTokenizer(false)
  const parser = new GfmParser().replaceTokenizer(tokenizer)

  expect(parser.parse('>> x')).toMatchObject({
    children: [{ type: BlockquoteType, children: [] }],
  })
  expect(tokenizer.events).toEqual(['enter:1', 'exit:1'])
})

test('throws child failures back into the suspended parent generator', () => {
  const tokenizer = new RecoveringBlockquoteTokenizer()
  const parser = new GfmParser().replaceTokenizer(tokenizer)

  expect(parser.parse('>> x')).toMatchObject({
    children: [{ type: BlockquoteType, children: [] }],
  })
  expect(tokenizer.events).toEqual(['enter:1', 'enter:2', 'finally:2', 'catch:1', 'finally:1'])
})

test('throws generator result iteration failures back into the suspended parent', () => {
  const tokenizer = new RecoveringBlockquoteTokenizer('iterator')
  const parser = new GfmParser().replaceTokenizer(tokenizer)

  expect(parser.parse('>> x')).toMatchObject({
    children: [{ type: BlockquoteType, children: [] }],
  })
  expect(tokenizer.events).toEqual(['enter:1', 'enter:2', 'finally:2', 'catch:1', 'finally:1'])
})

test('parses 3,000 nested block quotes without recursive stack growth', () => {
  const depth = 3_000
  const ast = parsers.gfm.parse(`${'>'.repeat(depth)} x`)
  let node: any = ast.children[0]

  for (let i = 0; i < depth; ++i) node = node.children[0]

  expect(node).toMatchObject({
    type: 'paragraph',
    children: [{ type: 'text', value: 'x' }],
  })
})

test('rejects cyclic block token trees', () => {
  const parser = new GfmParser().replaceTokenizer(new CyclicBlockquoteTokenizer())

  expect(() => parser.parse('> x')).toThrowError(
    "[parseBlock] cyclic or shared token tree at tokenizer '@yozora/tokenizer-blockquote'",
  )
})

test('rejects asynchronous block hook generators', () => {
  const parser = new GfmParser().replaceTokenizer(new AsyncBlockquoteTokenizer())

  expect(() => parser.parse('> x')).toThrowError(
    "[parseBlock] tokenizer '@yozora/tokenizer-blockquote' returned an invalid result",
  )
})

test('rejects malformed generator iterator results', () => {
  const parser = new GfmParser().replaceTokenizer(new MalformedIteratorResultBlockquoteTokenizer())

  expect(() => parser.parse('> x')).toThrowError(
    '[parseBlock] generator returned an invalid iterator result',
  )
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

test('handles unmatched cross-tokenizer delimiters without quadratic scans', () => {
  const count = 100_000
  const source = '[x]: <'.repeat(count)
  const ast = parsers.gfm.parse(source, { shouldReservePosition: false })

  expect(ast.children).toEqual([{ type: 'paragraph', children: [{ type: 'text', value: source }] }])
})

test('materializes wide sibling lists without exceeding the argument limit', () => {
  const count = 150_000
  const ast = parsers.gfm.parse('x\n\n'.repeat(count), { shouldReservePosition: false })

  expect(ast.children).toHaveLength(count)
  expect(ast.children[0]).toMatchObject({ type: 'paragraph' })
  expect(ast.children.at(-1)).toMatchObject({ type: 'paragraph' })
})
