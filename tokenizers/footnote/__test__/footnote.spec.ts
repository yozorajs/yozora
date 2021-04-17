import { createTesters, parsers } from '../../../jest.setup'
import FootnoteTokenizer from '../src'

createTesters(
  parsers.gfm.useTokenizer(new FootnoteTokenizer()),
  parsers.gfmEx.useTokenizer(new FootnoteTokenizer()),
  parsers.yozora,
).forEach(tester => tester.scan('custom/footnote').runTest())
