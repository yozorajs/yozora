import type { IRoot } from '@yozora/ast'
import { ListType, ParagraphType, TextType } from '@yozora/ast'
import { loadJSONFixture } from 'jest.setup'
import { collectNodes } from '../src'

describe('collectNodes', function () {
  test('basic1', function () {
    const originalAst: Readonly<IRoot> = loadJSONFixture('basic1.ast.json')
    const ast: IRoot = loadJSONFixture('basic1.ast.json')

    expect(collectNodes(ast, [TextType])).toMatchSnapshot()
    expect(collectNodes(ast, [ParagraphType, ListType])).toMatchSnapshot()
    expect(ast).toEqual(originalAst)
  })
})
