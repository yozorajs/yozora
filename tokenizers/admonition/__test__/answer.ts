import { createTester, parsers } from '../../../jest.setup'
import { AdmonitionTokenizer } from '../src'

const exTester = createTester(
  parsers.gfmEx.useTokenizer(new AdmonitionTokenizer({ priority: 10 })),
)

exTester.scan('cases', __dirname).runAnswer()
