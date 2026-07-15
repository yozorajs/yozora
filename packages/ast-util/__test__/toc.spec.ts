import type { Root } from '@yozora/ast'
import { describe, expect, test } from 'vitest'
import { loadJSONFixture } from 'vitest.setup'
import { calcHeadingToc, calcIdentifierFromNodes } from '../src'

function createHeadingAst(values: readonly string[]): Root {
  return {
    type: 'root',
    children: values.map(value => ({
      type: 'heading',
      depth: 1,
      children: [{ type: 'text', value }],
    })),
  }
}

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

    test('avoids prototype and suffix collisions', function () {
      const headings = ['constructor', 'constructor', 'foo', 'foo-2', 'foo', 'foo-2']
      const ast = createHeadingAst(headings)

      const toc = calcHeadingToc(ast, '')

      expect(toc.children.map(node => node.identifier)).toEqual([
        'constructor',
        'constructor-2',
        'foo',
        'foo-2',
        'foo-3',
        'foo-2-2',
      ])
    })

    test('many duplicated headings', function () {
      const size = 10_000
      const ast = createHeadingAst(Array<string>(size).fill('title'))

      const toc = calcHeadingToc(ast, '')
      const identifiers = toc.children.map(node => node.identifier)

      expect(toc.children).toHaveLength(size)
      expect(identifiers.at(-1)).toBe('title-' + size)
      expect(new Set(identifiers).size).toBe(size)
    })
  })
})

describe('calcIdentifierFromYastNodes', function () {
  test('basic1', function () {
    const originalAst: Readonly<Root> = loadJSONFixture('basic1.ast.json')
    const ast: Root = loadJSONFixture('basic1.ast.json')
    expect(calcIdentifierFromNodes(ast.children)).toMatchSnapshot()
    expect(ast).toEqual(originalAst)
  })
})
