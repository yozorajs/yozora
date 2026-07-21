import { createTokenizerTesters } from '@yozora/test-util'
import { describe, expect, test } from 'vitest'
import { parsers } from 'vitest.setup'
import EcmaImportTokenizer from '../src'
import { regex1, regex2, regex3 } from '../src/util'

createTokenizerTesters(
  parsers.gfm.useTokenizer(new EcmaImportTokenizer()),
  parsers.gfmEx.useTokenizer(new EcmaImportTokenizer()),
  parsers.yozora,
).forEach(tester => tester.scan(['custom/ecma-import']).runTest())

test('ecma import node should omit position when shouldReservePosition is false', function () {
  const parser = parsers.gfm.useTokenizer(new EcmaImportTokenizer())
  const ast = parser.parse(
    "import Parser, { createTokenizerTester as create } from '@yozora/test-util'",
    {
      shouldReservePosition: false,
    },
  )
  const node = ast.children[0] as any

  expect(node.type).toBe('ecmaImport')
  expect(node.moduleName).toBe('@yozora/test-util')
  expect(node.defaultImport).toBe('Parser')
  expect(node.namedImports).toEqual([{ src: 'createTokenizerTester', alias: 'create' }])
  expect(node.position).toBeUndefined()
})

describe('identifier validation', () => {
  const parseFirstNode = (source: string) =>
    parsers.gfm
      .useTokenizer(new EcmaImportTokenizer())
      .parse(source, { shouldReservePosition: false }).children[0]

  test.each([
    ["import $foo from 'pkg'", '$foo'],
    ["import 变量 from 'pkg'", '变量'],
    ["import foo1 from 'pkg';", 'foo1'],
  ])('accepts supported default binding in %s', (source, defaultImport) => {
    expect(parseFirstNode(source)).toMatchObject({
      type: 'ecmaImport',
      moduleName: 'pkg',
      defaultImport,
    })
  })

  test('accepts supported Unicode identifiers and reserved imported names', () => {
    const node = parseFirstNode(
      "import $default, { $value, default as 变量, for as loop } from 'pkg';",
    )

    expect(node).toMatchObject({
      type: 'ecmaImport',
      moduleName: 'pkg',
      defaultImport: '$default',
      namedImports: [
        { src: '$value', alias: null },
        { src: 'default', alias: '变量' },
        { src: 'for', alias: 'loop' },
      ],
    })
  })

  test('uses null when a default import is absent', () => {
    expect(parseFirstNode("import { foo } from 'pkg'")).toMatchObject({
      type: 'ecmaImport',
      defaultImport: null,
    })
  })

  test('accepts a trailing comma in named imports', () => {
    expect(parseFirstNode("import { foo, } from 'pkg'")).toMatchObject({
      type: 'ecmaImport',
      moduleName: 'pkg',
      namedImports: [{ src: 'foo', alias: null }],
    })
    expect(parseFirstNode("import Foo, { bar, baz as qux, } from 'pkg';")).toMatchObject({
      type: 'ecmaImport',
      moduleName: 'pkg',
      defaultImport: 'Foo',
      namedImports: [
        { src: 'bar', alias: null },
        { src: 'baz', alias: 'qux' },
      ],
    })
  })

  test.each([
    "import 1foo from 'pkg'",
    "import { 1foo } from 'pkg'",
    "import for from 'pkg'",
    "import eval from 'pkg'",
    "import arguments from 'pkg'",
    "import { default } from 'pkg'",
    "import { value as for } from 'pkg'",
    "import { foo,, } from 'pkg'",
    "import foo from 'pkg';;",
    String.raw`import \u0066oo from 'pkg'`,
    "import { 'value-name' as value } from 'pkg'",
  ])('rejects unsupported or invalid declaration %s', source => {
    expect(parseFirstNode(source)).toMatchObject({ type: 'paragraph' })
  })
})

describe('util', function () {
  test('regex1', function () {
    expect(regex1.test("import '@yozora/parser'")).toBe(true)
    expect(regex1.test('import "@yozora/parser"')).toBe(true)
    expect(regex1.test('import \'@yozora/parser"')).toBe(false)
    expect(regex1.test('import "@yozora/parser\'')).toBe(false)
    expect(regex1.test("import Parser from '@yozora/parser'")).toBe(false)
  })

  test('regex2', function () {
    expect(regex2.test("import Parser from '@yozora/parser'")).toBe(true)
    expect(regex2.test('import Parser from "@yozora/parser"')).toBe(true)
    expect(regex2.test('import Parser from \'@yozora/parser"')).toBe(false)
    expect(regex2.test('import Parser from "@yozora/parser\'')).toBe(false)
    expect(regex2.test('import { Parser } from "@yozora/parser\'')).toBe(false)
  })

  test('regex3', function () {
    expect(regex3.test("import Parser, { a, b as c } from '@yozora/parser'")).toBe(true)
    expect(regex3.test('import Parser, { a as c, b as d, e } from "@yozora/parser"')).toBe(true)
    expect(regex3.test('import Parser, { a, b, c } from "@yozora/parser"')).toBe(true)
    expect(regex3.test("import { a, b as c } from '@yozora/parser'")).toBe(true)
    expect(regex3.test('import { a as c, b as d, e } from "@yozora/parser"')).toBe(true)
    expect(regex3.test('import { a, b, c } from "@yozora/parser"')).toBe(true)
    expect(regex3.test('import { a, b, c }, Parser from "@yozora/parser"')).toBe(false)
    expect(regex3.test('import Parser from \'@yozora/parser"')).toBe(false)
    expect(regex3.test('import Parser from "@yozora/parser\'')).toBe(false)
  })
})
