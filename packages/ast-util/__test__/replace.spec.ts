import type { InlineCode, Root, YastLiteral } from '@yozora/ast'
import { InlineCodeType, LinkType, TextType } from '@yozora/ast'
import { replaceAST } from '../src'
import { loadJSONFixture } from './_util'

describe('replaceAST', function () {
  const originalAst: Readonly<Root> = loadJSONFixture('basic1.ast.json')

  test('specific aimTypes', function () {
    const ast: Root = loadJSONFixture('basic1.ast.json')
    replaceAST(ast, [TextType], (node, parent, childIndex) => {
      if (childIndex === 0) {
        const result: InlineCode = {
          type: InlineCodeType,
          value: (node as YastLiteral).value,
        }
        return result
      }
      return node
    })
    expect(ast).toMatchSnapshot()
    expect(ast).not.toEqual(originalAst)
  })

  test('allTypes', function () {
    const ast: Root = loadJSONFixture('basic1.ast.json')
    replaceAST(ast, null, (node, parent, childIndex) => {
      const { value } = node as YastLiteral
      if (value == null) return node

      if (childIndex === 0) {
        const result: InlineCode = {
          type: InlineCodeType,
          value: (node as YastLiteral).value,
        }
        return result
      }

      return node
    })
    expect(ast).toMatchSnapshot()
    expect(ast).not.toEqual(originalAst)
  })

  test('remove node', function () {
    const ast: Root = loadJSONFixture('basic1.ast.json')
    replaceAST(ast, [LinkType], () => null)
    expect(ast).toMatchSnapshot()
    expect(ast).not.toEqual(originalAst)
  })
})
