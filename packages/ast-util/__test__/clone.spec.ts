import type { Root } from '@yozora/ast'
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
