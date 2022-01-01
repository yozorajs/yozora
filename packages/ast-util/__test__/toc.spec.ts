import type { IRoot } from '@yozora/ast'
import { loadJSONFixture } from 'jest.setup'
import { calcHeadingToc, calcIdentifierFromYastNodes } from '../src'

describe('calcHeadingToc', function () {
  describe('basic1', function () {
    const originalAst: Readonly<IRoot> = loadJSONFixture('basic1.ast.json')
    const ast: IRoot = loadJSONFixture('basic1.ast.json')

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
      const ast: IRoot = {
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
    const originalAst: Readonly<IRoot> = loadJSONFixture('basic1.ast.json')
    const ast: IRoot = loadJSONFixture('basic1.ast.json')
    expect(calcIdentifierFromYastNodes(ast.children)).toMatchSnapshot()
    expect(ast).toEqual(originalAst)
  })
})
