import type { Root } from '@yozora/ast'
import { describe, expect, test } from 'vitest'
import { loadJSONFixture } from 'vitest.setup'
import { resolveUrlsForAst } from '../src'

describe('resolveUrlsForAst', function () {
  test('basic1', function () {
    const originalAst: Readonly<Root> = loadJSONFixture('basic1.ast.json')
    const ast: Root = loadJSONFixture('basic1.ast.json')

    resolveUrlsForAst(ast, undefined, p => 'waw-' + p)
    expect(ast).toMatchSnapshot()
    expect(ast).not.toEqual(originalAst)
  })

  test('defaultUrlResolver', function () {
    const originalAst: Readonly<Root> = loadJSONFixture('basic1.ast.json')
    const ast: Root = loadJSONFixture('basic1.ast.json')

    resolveUrlsForAst(ast)
    expect(ast).toMatchSnapshot()
    expect(ast).not.toEqual(originalAst)
  })
})
