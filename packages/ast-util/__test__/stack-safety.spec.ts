import type { Literal, Node, Parent, Point, Root } from '@yozora/ast'
import { RootType, TextType } from '@yozora/ast'
import { expect, test } from 'vitest'
import {
  calcExcerptAst,
  collectNodes,
  collectTexts,
  removePositions,
  searchNode,
  shallowCloneAst,
  shallowMutateAstInPostorder,
  shallowMutateAstInPostorderAsync,
  shallowMutateAstInPreorder,
  shallowMutateAstInPreorderAsync,
  traverseAst,
} from '../src'

const depth = 20_000
const position: { start: Point; end: Point } = {
  start: { line: 1, column: 1, offset: 0 },
  end: { line: 1, column: 2, offset: 1 },
}

function createDeepAst(): Root {
  let node: Node = { type: TextType, value: 'x', position } as Literal
  for (let i = 0; i < depth; ++i) {
    node = { type: 'parent', children: [node], position } as Parent
  }
  return { type: RootType, children: [node], position }
}

function getLeaf(root: Readonly<Root>): Readonly<Node> {
  let node: Readonly<Node> = root
  for (;;) {
    const children = (node as Readonly<Parent>).children
    if (children == null || children.length <= 0) return node
    node = children[0]
  }
}

test('traverses a deep AST without overflowing the call stack', function () {
  const ast = createDeepAst()
  let count = 0

  traverseAst(ast, null, () => {
    count += 1
  })

  expect(count).toBe(depth + 1)
  expect(searchNode(ast, node => node.type === TextType)).toEqual(Array(depth + 1).fill(0))
  expect(collectNodes(ast, [TextType])).toEqual([getLeaf(ast)])
  expect(collectTexts(ast.children)).toEqual(['x'])
})

test('clones a deep AST without overflowing the call stack', function () {
  const ast = createDeepAst()
  const clonedAst = shallowCloneAst(ast, () => false)
  const excerptAst = calcExcerptAst(ast, 1)
  const astWithoutPositions = removePositions(ast)

  expect(clonedAst === ast).toBe(false)
  expect(getLeaf(clonedAst)).toBe(getLeaf(ast))
  expect((getLeaf(excerptAst) as Literal).value).toBe('x')

  let node: Readonly<Node> = astWithoutPositions
  for (;;) {
    expect(node.position).toBeUndefined()
    const children = (node as Readonly<Parent>).children
    if (children == null || children.length <= 0) break
    node = children[0]
  }
  expect(ast.position).toBe(position)
})

test('mutates a deep AST without overflowing the call stack', async function () {
  const ast = createDeepAst()
  const replace = (node: Readonly<Node>): Literal => ({ ...(node as Literal), value: 'y' })
  const replaceAsync = async (node: Readonly<Node>): Promise<Literal> => replace(node)

  const results = [
    shallowMutateAstInPreorder(ast, [TextType], replace),
    shallowMutateAstInPostorder(ast, [TextType], replace),
    await shallowMutateAstInPreorderAsync(ast, [TextType], replaceAsync),
    await shallowMutateAstInPostorderAsync(ast, [TextType], replaceAsync),
  ]

  for (const result of results) {
    expect(result === ast).toBe(false)
    expect((getLeaf(result) as Literal).value).toBe('y')
  }
  expect((getLeaf(ast) as Literal).value).toBe('x')
})
