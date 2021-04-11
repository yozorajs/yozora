import { createTester, parsers } from '../../../jest.setup'

createTester(parsers.gfmEx).scan('cases', __dirname).runAnswer()
