import { createMarkupTester } from '@yozora/jest-for-tokenizer'
import { defaultMarkupWeaver } from '../src'

createMarkupTester(defaultMarkupWeaver).scan('custom/admonition').runTest()
