import { createTokenizerTesters } from '@yozora/jest-for-tokenizer'
import { parsers } from 'jest.setup'
import EcmaImportTokenizer from '../src'
import { regex1, regex2, regex3 } from '../src/util'

createTokenizerTesters(
  parsers.gfm.useTokenizer(new EcmaImportTokenizer()),
  parsers.gfmEx.useTokenizer(new EcmaImportTokenizer()),
  parsers.yozora,
).forEach(tester => tester.scan(['custom/ecma-import']).runTest())

describe('util', function () {
  test('regex1', function () {
    expect(regex1.test(`import '@yozora/parser'`)).toBe(true)
    expect(regex1.test(`import "@yozora/parser"`)).toBe(true)
    expect(regex1.test(`import '@yozora/parser"`)).toBe(false)
    expect(regex1.test(`import "@yozora/parser'`)).toBe(false)
    expect(regex1.test(`import Parser from '@yozora/parser'`)).toBe(false)
  })

  test('regex2', function () {
    expect(regex2.test(`import Parser from '@yozora/parser'`)).toBe(true)
    expect(regex2.test(`import Parser from "@yozora/parser"`)).toBe(true)
    expect(regex2.test(`import Parser from '@yozora/parser"`)).toBe(false)
    expect(regex2.test(`import Parser from "@yozora/parser'`)).toBe(false)
    expect(regex2.test(`import { Parser } from "@yozora/parser'`)).toBe(false)
  })

  test('regex3', function () {
    expect(regex3.test(`import Parser, { a, b as c } from '@yozora/parser'`)).toBe(true)
    expect(regex3.test(`import Parser, { a as c, b as d, e } from "@yozora/parser"`)).toBe(true)
    expect(regex3.test(`import Parser, { a, b, c } from "@yozora/parser"`)).toBe(true)
    expect(regex3.test(`import { a, b as c } from '@yozora/parser'`)).toBe(true)
    expect(regex3.test(`import { a as c, b as d, e } from "@yozora/parser"`)).toBe(true)
    expect(regex3.test(`import { a, b, c } from "@yozora/parser"`)).toBe(true)
    expect(regex3.test(`import { a, b, c }, Parser from "@yozora/parser"`)).toBe(false)
    expect(regex3.test(`import Parser from '@yozora/parser"`)).toBe(false)
    expect(regex3.test(`import Parser from "@yozora/parser'`)).toBe(false)
  })
})
