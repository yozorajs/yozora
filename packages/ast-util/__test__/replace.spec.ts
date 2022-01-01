import type { IInlineCode, IRoot, IYastLiteral } from '@yozora/ast'
import { InlineCodeType, LinkType, TextType } from '@yozora/ast'
import { loadJSONFixture } from 'jest.setup'
import { shallowMutateAstInPostorder, shallowMutateAstInPreorder } from '../src'

describe('replace-post-order', function () {
  const originalAst: Readonly<IRoot> = loadJSONFixture('basic1.ast.json')

  test('specific aimTypes', function () {
    const ast: IRoot = loadJSONFixture('basic1.ast.json')
    shallowMutateAstInPostorder(ast, [TextType], (node, parent, childIndex) => {
      if (childIndex === 0) {
        const result: IInlineCode = {
          type: InlineCodeType,
          value: (node as IYastLiteral).value,
        }
        return result
      }
      return node
    })
    expect(ast).toMatchSnapshot()
    expect(ast).toEqual(originalAst)
  })

  test('allTypes', function () {
    const ast: IRoot = loadJSONFixture('basic1.ast.json')
    shallowMutateAstInPostorder(ast, null, (node, parent, childIndex) => {
      const { value } = node as IYastLiteral
      if (value == null) return node

      if (childIndex === 0) {
        const result: IInlineCode = {
          type: InlineCodeType,
          value: (node as IYastLiteral).value,
        }
        return result
      }

      return node
    })
    expect(ast).toMatchSnapshot()
    expect(ast).toEqual(originalAst)
  })

  test('remove node', function () {
    const ast: IRoot = loadJSONFixture('basic1.ast.json')
    shallowMutateAstInPostorder(ast, [LinkType], () => null)
    expect(ast).toMatchSnapshot()
    expect(ast).toEqual(originalAst)
  })
})

describe('replace-pre-order', function () {
  const originalAst: Readonly<IRoot> = loadJSONFixture('basic1.ast.json')

  test('specific aimTypes', function () {
    const ast: IRoot = loadJSONFixture('basic1.ast.json')
    shallowMutateAstInPreorder(ast, [TextType], (node, parent, childIndex) => {
      if (childIndex === 0) {
        const result: IInlineCode = {
          type: InlineCodeType,
          value: (node as IYastLiteral).value,
        }
        return result
      }
      return node
    })
    expect(ast).toMatchSnapshot()
    expect(ast).toEqual(originalAst)
  })

  test('allTypes', function () {
    const ast: IRoot = loadJSONFixture('basic1.ast.json')
    shallowMutateAstInPreorder(ast, null, (node, parent, childIndex) => {
      const { value } = node as IYastLiteral
      if (value == null) return node

      if (childIndex === 0) {
        const result: IInlineCode = {
          type: InlineCodeType,
          value: (node as IYastLiteral).value,
        }
        return result
      }

      return node
    })
    expect(ast).toMatchSnapshot()
    expect(ast).toEqual(originalAst)
  })

  test('remove node', function () {
    const ast: IRoot = loadJSONFixture('basic1.ast.json')
    shallowMutateAstInPreorder(ast, [LinkType], () => null)
    expect(ast).toMatchSnapshot()
    expect(ast).toEqual(originalAst)
  })
})
