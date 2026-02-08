import type { Root } from '@yozora/ast'
import { ListType, ParagraphType, TextType } from '@yozora/ast'
import { describe, expect, test } from 'vitest'
import { loadJSONFixture } from 'vitest.setup'
import { collectNodes } from '../src'

describe('collectNodes', function () {
  test('basic1', function () {
    const originalAst: Readonly<Root> = loadJSONFixture('basic1.ast.json')
    const ast: Root = loadJSONFixture('basic1.ast.json')

    expect(collectNodes(ast, [TextType])).toMatchSnapshot()
    expect(collectNodes(ast, [ParagraphType, ListType])).toMatchSnapshot()
    expect(ast).toEqual(originalAst)
  })
})
