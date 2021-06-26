import type { Root, YastLiteral } from '@yozora/ast'
import { TextType } from '@yozora/ast'
import { traverseAST } from '../src'
import { loadJSONFixture } from './_util'

describe('traverseAST', function () {
  const originalAst: Readonly<Root> = loadJSONFixture('basic1.ast.json')

  test('specific aimTypes', function () {
    const ast: Root = loadJSONFixture('basic1.ast.json')
    traverseAST(ast, [TextType], (node, parent, childIndex): void => {
      if (childIndex === 0) {
        // eslint-disable-next-line no-param-reassign
        ;(node as YastLiteral).value = '+++' + (node as YastLiteral).value
      }
    })
    expect(ast).toMatchSnapshot()
    expect(ast).not.toEqual(originalAst)
  })

  test('allTypes', function () {
    const ast: Root = loadJSONFixture('basic1.ast.json')
    traverseAST(ast, null, (node, parent, childIndex): void => {
      const { value } = node as YastLiteral
      if (value == null) return

      if (childIndex === 0) {
        // eslint-disable-next-line no-param-reassign
        ;(node as YastLiteral).value = '+++' + (node as YastLiteral).value
      }
    })
    expect(ast).toMatchSnapshot()
    expect(ast).not.toEqual(originalAst)
  })
})
