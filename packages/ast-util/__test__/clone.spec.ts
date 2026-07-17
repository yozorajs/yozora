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

  test('captures parent changes made by the termination condition', function () {
    const parent: Parent & { label: string } = {
      type: 'parent',
      label: 'before',
      children: [{ type: 'child' }, { type: 'stop' }],
    }
    const ast: Root & { label: string } = {
      type: 'root',
      label: 'before',
      children: [parent],
    }

    const clonedAst = shallowCloneAst(ast, (node, parentNode) => {
      Object.assign(parentNode, { label: 'after' })
      return node.type === 'stop'
    }) as Root & { label: string }

    expect(clonedAst.label).toBe('after')
    expect(clonedAst.children[0]).toEqual({
      type: 'parent',
      label: 'after',
      children: [{ type: 'child' }],
    })
  })
})
