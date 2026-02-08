import type { Literal, Root } from '@yozora/ast'
import { TextType } from '@yozora/ast'
import { describe, expect, test } from 'vitest'
import { loadJSONFixture } from 'vitest.setup'
import { traverseAst } from '../src'

describe('traverseAST', function () {
  const originalAst: Readonly<Root> = loadJSONFixture('basic1.ast.json')

  test('specific aimTypes', function () {
    const ast: Root = loadJSONFixture('basic1.ast.json')
    traverseAst(ast, [TextType], (node, parent, childIndex): void => {
      if (childIndex === 0) {
        // eslint-disable-next-line no-param-reassign
        ;(node as Literal).value = '+++' + (node as Literal).value
      }
    })
    expect(ast).toMatchSnapshot()
    expect(ast).not.toEqual(originalAst)
  })

  test('allTypes', function () {
    const ast: Root = loadJSONFixture('basic1.ast.json')
    traverseAst(ast, null, (node, parent, childIndex): void => {
      const { value } = node as Literal
      if (value == null) return

      if (childIndex === 0) {
        // eslint-disable-next-line no-param-reassign
        ;(node as Literal).value = '+++' + (node as Literal).value
      }
    })
    expect(ast).toMatchSnapshot()
    expect(ast).not.toEqual(originalAst)
  })
})
