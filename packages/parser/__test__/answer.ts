import { createTester, parsers } from '../../../jest.setup'

const tester = createTester(parsers.yozora)
tester.scan(['cases'], __dirname).runAnswer()
