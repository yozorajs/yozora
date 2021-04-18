import FootnoteTokenizer from '@yozora/tokenizer-footnote'
import { createTesters, parsers } from '../../../jest.setup'
import FootnoteDefinitionTokenizer from '../src'

createTesters(
  parsers.gfm
    .useTokenizer(new FootnoteDefinitionTokenizer())
    .useTokenizer(new FootnoteTokenizer()),
  parsers.gfmEx
    .useTokenizer(new FootnoteDefinitionTokenizer())
    .useTokenizer(new FootnoteTokenizer()),
  parsers.yozora,
).forEach(tester => tester.scan(['custom/footnote-definition']).runTest())
