import { createTokenizerTester } from '@yozora/test-util'
import { parsers } from 'vitest.setup'

createTokenizerTester('gfm-ex', parsers.gfmEx).scan('**/*.json').runTest()
