import type { Root } from '@yozora/ast'
import { loadJSONFixture } from 'jest.setup'
import { calcExcerptAst } from '../src'

describe('basic1', function () {
  const originalAst: Readonly<Root> = loadJSONFixture('basic1.ast.json')
  const ast: Root = loadJSONFixture('basic1.ast.json')

  test('default', function () {
    const excerptAst = calcExcerptAst(ast, 140)
    expect(ast).toEqual(originalAst)
    expect(excerptAst).not.toEqual(originalAst)
    expect(excerptAst).toMatchSnapshot()
  })

  test('excerpt-40', function () {
    const excerptAst = calcExcerptAst(ast, 40)
    expect(ast).toEqual(originalAst)
    expect(excerptAst).not.toEqual(originalAst)
    expect(excerptAst).toMatchSnapshot()
  })
})
