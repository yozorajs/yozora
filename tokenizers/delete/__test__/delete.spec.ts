import { createTester, parsers } from '../../../jest.setup'
import DeleteTokenizer from '../src'

const tester = createTester(parsers.gfm)
tester.parser.useTokenizer(new DeleteTokenizer())
tester.scan('gfm/delete').runTest()

createTester(parsers.gfmEx).scan('gfm/delete').runTest()
