import { createTester } from '../../../jest.setup'
import YozoraParser from '../src'

const tester = createTester(new YozoraParser({ shouldReservePosition: true }))
tester.scan(['cases'], __dirname).runAnswer()
