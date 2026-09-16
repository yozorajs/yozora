import { parsers } from 'vitest.setup'
import { createTokenizerTester } from '../../../script/test/index.mjs'

createTokenizerTester('gfm-ex', parsers.gfmEx).scan('**/*.json').runTest()
