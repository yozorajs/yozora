import type { IRoot } from '@yozora/ast'
import { loadJSONFixture } from 'jest.setup'
import { resolveUrlsForAst } from '../src'

describe('resolveUrlsForAst', function () {
  test('basic1', function () {
    const originalAst: Readonly<IRoot> = loadJSONFixture('basic1.ast.json')
    const ast: IRoot = loadJSONFixture('basic1.ast.json')

    resolveUrlsForAst(ast, undefined, p => 'waw-' + p)
    expect(ast).toMatchSnapshot()
    expect(ast).not.toEqual(originalAst)
  })

  test('defaultUrlResolver', function () {
    const originalAst: Readonly<IRoot> = loadJSONFixture('basic1.ast.json')
    const ast: IRoot = loadJSONFixture('basic1.ast.json')

    resolveUrlsForAst(ast)
    expect(ast).toMatchSnapshot()
    expect(ast).not.toEqual(originalAst)
  })
})
