import type { IRoot } from '@yozora/ast'
import { loadJSONFixture } from 'jest.setup'
import { shallowCloneAst } from '../src'

describe('basic1', function () {
  const originalAst: Readonly<IRoot> = loadJSONFixture('basic1.ast.json')
  const ast: IRoot = loadJSONFixture('basic1.ast.json')

  test('full', function () {
    const bakAst = shallowCloneAst(ast, () => false)
    expect(bakAst).toMatchSnapshot()
    expect(ast).toEqual(originalAst)
  })
})
