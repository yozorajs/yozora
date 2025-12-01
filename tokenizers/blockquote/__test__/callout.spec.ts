import { DefaultParser } from '@yozora/core-parser'
import { createTokenizerTester } from '@yozora/jest-for-tokenizer'
import BlockquoteTokenizer from '@yozora/tokenizer-blockquote'
import ParagraphTokenizer from '@yozora/tokenizer-paragraph'
import TextTokenizer from '@yozora/tokenizer-text'

const parser = new DefaultParser({
  defaultParseOptions: { shouldReservePosition: true },
  blockFallbackTokenizer: new ParagraphTokenizer(),
  inlineFallbackTokenizer: new TextTokenizer(),
}).useTokenizer(new BlockquoteTokenizer({ enableGithubCallout: true }))

createTokenizerTester(parser).scan('custom/blockquote-callout').runTest()
