import type { Root, YastLiteral } from '@yozora/ast'
import { searchNode } from '../src'
import { loadJSONFixture } from './_util'

describe('basic1', function () {
  const originalAst: Readonly<Root> = loadJSONFixture('basic1.ast.json')
  const ast: Root = loadJSONFixture('basic1.ast.json')

  test('first node', function () {
    expect(searchNode(ast, node => true)).toEqual([0])
    expect(ast).toEqual(originalAst)
  })

  test('special node', function () {
    expect(
      searchNode(ast, node => {
        const { type, value } = node as YastLiteral
        return type === 'text' && value === 'bar'
      }),
    ).toEqual([1, 1, 1, 0])
    expect(ast).toEqual(originalAst)
  })

  test('miss', function () {
    expect(
      searchNode(ast, node => {
        const { type, value } = node as YastLiteral
        return type === 'text' && value === '____bar_______bar___'
      }),
    ).toEqual(null)
    expect(ast).toEqual(originalAst)
  })
})
