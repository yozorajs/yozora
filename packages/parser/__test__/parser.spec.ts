import { DefaultParser } from '@yozora/core-parser'
import YozoraParser from '@yozora/parser'
import { createTokenizerTester } from '@yozora/test-util'
import FencedCodeTokenizer, { FencedCodeTokenizerName } from '@yozora/tokenizer-fenced-code'
import InlineCodeTokenizer, { InlineCodeTokenizerName } from '@yozora/tokenizer-inline-code'
import InlineMathTokenizer from '@yozora/tokenizer-inline-math'
import ParagraphTokenizer from '@yozora/tokenizer-paragraph'
import TextTokenizer from '@yozora/tokenizer-text'
import { describe, expect, test } from 'vitest'
import { loadFixtures, parsers } from 'vitest.setup'

createTokenizerTester(parsers.yozora)
  .scan(['custom/**/*.json', '!custom/inline-math/backtick-required'])
  .scan(['gfm/**/*.json', '!gfm/**/#616.json', '!gfm/**/#619.json', '!gfm/**/#620.json'])
  .runTest()

createTokenizerTester(
  parsers.yozora.replaceTokenizer(
    new InlineMathTokenizer({ backtickRequired: true }),
    InlineCodeTokenizerName,
  ),
)
  .scan(['custom/inline-math/backtick-required'])
  .runTest()

describe('snapshot', function () {
  test('basic', function () {
    const content: string = loadFixtures('demo.md')
    const parser = parsers.yozora

    expect(parser.parse(content, { shouldReservePosition: true })).toMatchSnapshot(
      'should reserve position',
    )
    expect(parser.parse(content, { shouldReservePosition: false })).toMatchSnapshot(
      "shouldn't reserve position",
    )
  })
})

test('recognizes a table after partial-tab indentation', () => {
  const ast = parsers.yozora.parse(
    '1234. foo\n\n\t  header | value\n\t  \t--- | ---\n\t  cell | data',
  )
  const listItem = (ast.children[0] as any).children[0]

  expect(listItem.children[1].type).toBe('table')
})

test('recognizes an ECMA import after partial-tab indentation', () => {
  const ast = parsers.yozora.parse("1234. foo\n\n\t  \timport Parser from '@yozora/parser'")
  const listItem = (ast.children[0] as any).children[0]

  expect(listItem.children[1].type).toBe('ecmaImport')
})

test('constructs DefaultParser without props', () => {
  expect(new DefaultParser().parse('')).toEqual({ type: 'root', children: [] })
})

describe('fallback tokenizer registration', () => {
  const createParser = (): DefaultParser =>
    new DefaultParser({
      blockFallbackTokenizer: new ParagraphTokenizer(),
      inlineFallbackTokenizer: new TextTokenizer(),
    })

  test('rejects an inline name collision without mutating registration state', () => {
    const parser = createParser().useTokenizer(new InlineCodeTokenizer())

    expect(() =>
      parser.useFallbackTokenizer(new TextTokenizer({ name: InlineCodeTokenizerName })),
    ).toThrowError(`[useFallbackTokenizer] Name(${InlineCodeTokenizerName}) has been registered.`)
    expect(parser.parse('plain `code`')).toMatchObject({
      children: [
        {
          type: 'paragraph',
          children: [
            { type: 'text', value: 'plain ' },
            { type: 'inlineCode', value: 'code' },
          ],
        },
      ],
    })
  })

  test('rejects a block name collision without mutating registration state', () => {
    const parser = createParser().useTokenizer(new FencedCodeTokenizer())

    expect(() =>
      parser.useFallbackTokenizer(new ParagraphTokenizer({ name: FencedCodeTokenizerName })),
    ).toThrowError(`[useFallbackTokenizer] Name(${FencedCodeTokenizerName}) has been registered.`)
    expect(parser.parse('plain\n\n```\ncode\n```')).toMatchObject({
      children: [{ type: 'paragraph' }, { type: 'code' }],
    })
  })

  test('allows replacing fallback tokenizers with the same names', () => {
    const parser = createParser()

    expect(() => parser.useFallbackTokenizer(new ParagraphTokenizer())).not.toThrow()
    expect(() => parser.useFallbackTokenizer(new TextTokenizer())).not.toThrow()
    expect(parser.parse('plain')).toMatchObject({
      children: [{ type: 'paragraph', children: [{ type: 'text', value: 'plain' }] }],
    })
  })
})

describe('parse options', () => {
  test('uses built-in defaults for undefined default options', () => {
    const parser = new YozoraParser()
    parser.setDefaultParseOptions({
      shouldReservePosition: undefined,
      presetDefinitions: undefined,
      presetFootnoteDefinitions: undefined,
      formatUrl: undefined,
    })

    const ast = parser.parse('[link](/url)')

    expect(ast).not.toHaveProperty('position')
    expect(ast).toMatchObject({
      children: [{ children: [{ type: 'link', url: '/url' }] }],
    })
  })

  test('inherits configured defaults from undefined parse options', () => {
    const parser = new YozoraParser({
      defaultParseOptions: {
        shouldReservePosition: true,
        presetDefinitions: [{ identifier: 'link', label: 'link' }],
        presetFootnoteDefinitions: [{ identifier: 'note', label: 'note' }],
        formatUrl: url => `formatted:${url}`,
      },
    })

    const ast = parser.parse('[link][] [^note] [inline](/url)', {
      shouldReservePosition: undefined,
      presetDefinitions: undefined,
      presetFootnoteDefinitions: undefined,
      formatUrl: undefined,
    })

    expect(ast).toHaveProperty('position')
    expect(ast).toMatchObject({
      children: [
        {
          children: [
            { type: 'linkReference', identifier: 'link' },
            { type: 'text' },
            { type: 'footnoteReference', identifier: 'note' },
            { type: 'text' },
            { type: 'link', url: 'formatted:/url' },
          ],
        },
      ],
    })
  })
})
