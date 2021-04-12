import { createTesters, parsers } from '../../../jest.setup'
import TableTokenizer from '../src'

createTesters(
  parsers.gfm.useTokenizer(new TableTokenizer()),
  parsers.gfmEx,
  parsers.yozora,
).forEach(tester => tester.scan(['gfm/table', 'custom/table']).runTest())
