import type { Root } from '@yozora/ast'
import { ParagraphType, RootType, StrongType, TextType } from '@yozora/ast'
import {
  removePositions,
  shallowMutateAstInPostorderAsync,
  shallowMutateAstInPreorderAsync,
} from '../src'

function createAstWithPositions(): Root {
  return {
    type: RootType,
    position: {
      start: { offset: 0, line: 1, column: 1 },
      end: { offset: 3, line: 1, column: 4 },
    },
    children: [
      {
        type: ParagraphType,
        position: {
          start: { offset: 0, line: 1, column: 1 },
          end: { offset: 3, line: 1, column: 4 },
        },
        children: [
          {
            type: TextType,
            value: 'a',
            position: {
              start: { offset: 0, line: 1, column: 1 },
              end: { offset: 1, line: 1, column: 2 },
            },
          },
          {
            type: StrongType,
            position: {
              start: { offset: 1, line: 1, column: 2 },
              end: { offset: 3, line: 1, column: 4 },
            },
            children: [
              {
                type: TextType,
                value: 'b',
                position: {
                  start: { offset: 1, line: 1, column: 2 },
                  end: { offset: 2, line: 1, column: 3 },
                },
              },
            ],
          },
        ],
      },
    ],
  }
}

describe('removePositions', function () {
  test('remove all positions recursively without mutating input', function () {
    const ast = createAstWithPositions()
    const nextAst = removePositions(ast)

    expect(ast.position).toBeDefined()
    expect(nextAst.position).toBeUndefined()
    expect((nextAst.children[0] as any).position).toBeUndefined()
    expect((nextAst.children[0] as any).children[0].position).toBeUndefined()
    expect((nextAst.children[0] as any).children[1].children[0].position).toBeUndefined()
  })
})

describe('shallowMutateAstInPostorderAsync', function () {
  test('replace matched nodes in post-order', async function () {
    const ast = createAstWithPositions()
    const visited: string[] = []

    const nextAst = await shallowMutateAstInPostorderAsync(ast, [TextType], async (node: any) => {
      visited.push(node.value)
      if (node.value === 'b') return null
      return { ...node, value: node.value.toUpperCase() }
    })

    expect(visited).toEqual(['b', 'a'])
    expect((nextAst.children[0] as any).children).toEqual([
      {
        type: TextType,
        value: 'A',
        position: {
          start: { offset: 0, line: 1, column: 1 },
          end: { offset: 1, line: 1, column: 2 },
        },
      },
      {
        type: StrongType,
        position: {
          start: { offset: 1, line: 1, column: 2 },
          end: { offset: 3, line: 1, column: 4 },
        },
        children: [],
      },
    ])
    expect((ast.children[0] as any).children[0].value).toBe('a')
    expect((ast.children[0] as any).children[1].children[0].value).toBe('b')
  })
})

describe('shallowMutateAstInPreorderAsync', function () {
  test('matched parent node is replaced before traversing descendants', async function () {
    const ast = createAstWithPositions()
    const visited: string[] = []

    const nextAst = await shallowMutateAstInPreorderAsync(
      ast,
      [TextType, StrongType],
      async (node: any) => {
        if (node.type === StrongType) {
          visited.push('strong')
          return { type: TextType, value: 'S' }
        }

        visited.push(node.value)
        return node
      },
    )

    expect(visited).toEqual(['a', 'strong'])
    expect((nextAst.children[0] as any).children).toEqual([
      {
        type: TextType,
        value: 'a',
        position: {
          start: { offset: 0, line: 1, column: 1 },
          end: { offset: 1, line: 1, column: 2 },
        },
      },
      { type: TextType, value: 'S' },
    ])
  })
})
