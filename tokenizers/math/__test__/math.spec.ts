import { createTesters, parsers } from '../../../jest.setup'
import MathTokenizer from '../src'

createTesters(
  parsers.gfm.useTokenizer(new MathTokenizer()),
  parsers.gfmEx.useTokenizer(new MathTokenizer()),
  parsers.yozora,
).forEach(tester => tester.scan('custom/math').runTest())
