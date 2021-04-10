import { createExTester } from '../../../jest.setup'
import { AdmonitionTokenizer } from '../src'

const exTester = createExTester()
exTester.parser.useTokenizer(new AdmonitionTokenizer({ priority: 10 }))

exTester.scan('cases', __dirname).runTest()
