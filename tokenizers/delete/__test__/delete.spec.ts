import { createTesters, parsers } from '../../../jest.setup'
import DeleteTokenizer from '../src'

createTesters(
  parsers.gfm.useTokenizer(new DeleteTokenizer()),
  parsers.gfmEx,
  parsers.yozora,
).forEach(tester => tester.scan('gfm/delete').runTest())
