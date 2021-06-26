import type { Root } from '@yozora/ast'
import { ListType, ParagraphType, TextType } from '@yozora/ast'
import { collectNodes } from '../src'
import { loadJSONFixture } from './_util'

describe('collectNodes', function () {
  test('basic1', function () {
    const originalAst: Readonly<Root> = loadJSONFixture('basic1.ast.json')
    const ast: Root = loadJSONFixture('basic1.ast.json')

    expect(collectNodes(ast, [TextType])).toMatchSnapshot()
    expect(collectNodes(ast, [ParagraphType, ListType])).toMatchSnapshot()
    expect(ast).toEqual(originalAst)
  })
})
