import { createTokenizerTester } from '@yozora/jest-for-tokenizer'
import { InlineCodeTokenizerName } from '@yozora/tokenizer-inline-code'
import InlineMathTokenizer from '@yozora/tokenizer-inline-math'
import { loadFixtures, parsers } from 'jest.setup'

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
