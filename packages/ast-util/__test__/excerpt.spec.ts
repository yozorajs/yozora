import type { Root } from '@yozora/ast'
import { loadJSONFixture } from 'jest.setup'
import { calcExcerptAst } from '../src'

describe('basic1', function () {
  const originalAst: Readonly<Root> = loadJSONFixture('basic1.ast.json')
  const ast: Root = loadJSONFixture('basic1.ast.json')

  test('excerpt-140', function () {
    const excerptAst = calcExcerptAst(ast, 140)
    expect(excerptAst).toMatchSnapshot()
    expect(ast).toEqual(originalAst)
  })
})
