import type { Root } from '@yozora/ast'
import { calcHeadingToc, calcIdentifierFromYastNodes } from '../src'
import { loadJSONFixture } from './_util'

describe('calcHeadingToc', function () {
  describe('basic1', function () {
    const originalAst: Readonly<Root> = loadJSONFixture('basic1.ast.json')
    const ast: Root = loadJSONFixture('basic1.ast.json')

    test('default', function () {
      expect(calcHeadingToc(ast)).toMatchSnapshot()
      expect(ast).toMatchSnapshot('ast')
      expect(ast).not.toEqual(originalAst)
    })

    test('custom identifierPrefix', function () {
      expect(calcHeadingToc(ast, 'waw-')).toMatchSnapshot()
      expect(ast).toMatchSnapshot('ast')
      expect(ast).not.toEqual(originalAst)
    })

    test('duplicated heading', function () {
      const ast: Root = {
        type: 'root',
        children: [
          {
            type: 'heading',
            depth: 1,
            children: [
              {
                type: 'text',
                value: 'title1',
              },
            ],
          },
          {
            type: 'heading',
            depth: 1,
            children: [
              {
                type: 'text',
                value: 'title1',
              },
            ],
          },
          {
            type: 'heading',
            depth: 3,
            children: [
              {
                type: 'text',
                value: 'title1',
              },
            ],
          },
        ],
      } as any

      expect(calcHeadingToc(ast)).toMatchSnapshot()
      expect(ast).toMatchSnapshot('ast')
    })
  })
})

describe('calcIdentifierFromYastNodes', function () {
  test('basic1', function () {
    const originalAst: Readonly<Root> = loadJSONFixture('basic1.ast.json')
    const ast: Root = loadJSONFixture('basic1.ast.json')
    expect(calcIdentifierFromYastNodes(ast.children)).toMatchSnapshot()
    expect(ast).toEqual(originalAst)
  })
})
