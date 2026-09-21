import type { InlineCode, Literal, Paragraph, Root, Text } from '@yozora/ast'
import { InlineCodeType, LinkType, TextType } from '@yozora/ast'
import { describe, expect, test } from 'vitest'
import { loadJSONFixture } from 'vitest.setup'
import { shallowMutateAstInPostorder, shallowMutateAstInPreorder } from '../src'

describe.each([
  ['preorder', shallowMutateAstInPreorder],
  ['postorder', shallowMutateAstInPostorder],
] as const)('%s mutation results', function (_order, mutate) {
  test('expands and removes nodes while sharing unchanged subtrees', function () {
    const expanded: Text = { type: 'text', value: 'expand' }
    const removed: Text = { type: 'text', value: 'remove' }
    const retained: Text = { type: 'text', value: 'keep' }
    const paragraph: Paragraph = { type: 'paragraph', children: [expanded, removed, retained] }
    const untouched: Paragraph = { type: 'paragraph', children: [] }
    const ast: Root = { type: 'root', children: [paragraph, untouched] }
    const original = structuredClone(ast)
    const first: Text = { type: 'text', value: 'first' }
    const second: Text = { type: 'text', value: 'second' }

    const result = mutate(ast, [TextType], node => {
      if (node === expanded) return [first, second]
      if (node === removed) return null
      return node
    })

    expect(result).toEqual({
      type: 'root',
      children: [{ type: 'paragraph', children: [first, second, retained] }, untouched],
    })
    expect(result).not.toBe(ast)
    expect(result.children[0]).not.toBe(paragraph)
    expect(result.children[1]).toBe(untouched)
    expect((result.children[0] as Paragraph).children[2]).toBe(retained)
    expect(ast).toEqual(original)
  })

  test('does not visit or copy an empty root', function () {
    const ast: Root = { type: 'root', children: [] }

    expect(
      mutate(ast, null, () => {
        throw new Error('The root must not be visited')
      }),
    ).toBe(ast)
  })
})

describe('replace-post-order', function () {
  const originalAst: Readonly<Root> = loadJSONFixture('basic1.ast.json')

  test('specific aimTypes', function () {
    const ast: Root = loadJSONFixture('basic1.ast.json')
    shallowMutateAstInPostorder(ast, [TextType], (node, parent, childIndex) => {
      if (childIndex === 0) {
        const result: InlineCode = {
          type: InlineCodeType,
          value: (node as Literal).value,
        }
        return result
      }
      return node
    })
    expect(ast).toMatchSnapshot()
    expect(ast).toEqual(originalAst)
  })

  test('allTypes', function () {
    const ast: Root = loadJSONFixture('basic1.ast.json')
    shallowMutateAstInPostorder(ast, null, (node, parent, childIndex) => {
      const { value } = node as Literal
      if (value == null) return node

      if (childIndex === 0) {
        const result: InlineCode = {
          type: InlineCodeType,
          value: (node as Literal).value,
        }
        return result
      }

      return node
    })
    expect(ast).toMatchSnapshot()
    expect(ast).toEqual(originalAst)
  })

  test('remove node', function () {
    const ast: Root = loadJSONFixture('basic1.ast.json')
    shallowMutateAstInPostorder(ast, [LinkType], () => null)
    expect(ast).toMatchSnapshot()
    expect(ast).toEqual(originalAst)
  })
})

describe('replace-pre-order', function () {
  const originalAst: Readonly<Root> = loadJSONFixture('basic1.ast.json')

  test('specific aimTypes', function () {
    const ast: Root = loadJSONFixture('basic1.ast.json')
    shallowMutateAstInPreorder(ast, [TextType], (node, parent, childIndex) => {
      if (childIndex === 0) {
        const result: InlineCode = {
          type: InlineCodeType,
          value: (node as Literal).value,
        }
        return result
      }
      return node
    })
    expect(ast).toMatchSnapshot()
    expect(ast).toEqual(originalAst)
  })

  test('allTypes', function () {
    const ast: Root = loadJSONFixture('basic1.ast.json')
    shallowMutateAstInPreorder(ast, null, (node, parent, childIndex) => {
      const { value } = node as Literal
      if (value == null) return node

      if (childIndex === 0) {
        const result: InlineCode = {
          type: InlineCodeType,
          value: (node as Literal).value,
        }
        return result
      }

      return node
    })
    expect(ast).toMatchSnapshot()
    expect(ast).toEqual(originalAst)
  })

  test('remove node', function () {
    const ast: Root = loadJSONFixture('basic1.ast.json')
    shallowMutateAstInPreorder(ast, [LinkType], () => null)
    expect(ast).toMatchSnapshot()
    expect(ast).toEqual(originalAst)
  })
})
