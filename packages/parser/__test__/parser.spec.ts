import { createTokenizerTester } from '@yozora/test-util'
import { InlineCodeTokenizerName } from '@yozora/tokenizer-inline-code'
import InlineMathTokenizer from '@yozora/tokenizer-inline-math'
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
