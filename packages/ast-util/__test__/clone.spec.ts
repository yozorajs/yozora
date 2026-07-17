import type { Parent, Root } from '@yozora/ast'
import { describe, expect, test } from 'vitest'
import { loadJSONFixture } from 'vitest.setup'
import { shallowCloneAst } from '../src'

describe('basic1', function () {
  const originalAst: Readonly<Root> = loadJSONFixture('basic1.ast.json')
  const ast: Root = loadJSONFixture('basic1.ast.json')

  test('full', function () {
    const bakAst = shallowCloneAst(ast, () => false)
    expect(bakAst).toMatchSnapshot()
    expect(ast).toEqual(originalAst)
  })
})

describe('termination', function () {
  test('stops the whole traversal when a nested node matches', function () {
    const parent: Parent = {
      type: 'parent',
      children: [{ type: 'before' }, { type: 'stop' }],
    }
    const ast: Root = {
      type: 'root',
      children: [parent, { type: 'later' }],
    }
    const visitedNodeTypes: string[] = []

    const clonedAst = shallowCloneAst(ast, node => {
      visitedNodeTypes.push(node.type)
      return node.type === 'stop'
    })

    expect(clonedAst).toEqual({
      type: 'root',
      children: [
        {
          type: 'parent',
          children: [{ type: 'before' }],
        },
      ],
    })
    expect(visitedNodeTypes).toEqual(['parent', 'before', 'stop'])
  })
})
