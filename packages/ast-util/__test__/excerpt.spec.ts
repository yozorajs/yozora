import type { Literal, Parent, Root } from '@yozora/ast'
import { describe, expect, test } from 'vitest'
import { loadJSONFixture } from 'vitest.setup'
import { calcExcerptAst } from '../src'

describe('basic1', function () {
  const originalAst: Readonly<Root> = loadJSONFixture('basic1.ast.json')
  const ast: Root = loadJSONFixture('basic1.ast.json')

  test('default', function () {
    const excerptAst = calcExcerptAst(ast, 140)
    expect(ast).toEqual(originalAst)
    expect(excerptAst).not.toEqual(originalAst)
    expect(excerptAst).toMatchSnapshot()
  })

  test('excerpt-40', function () {
    const excerptAst = calcExcerptAst(ast, 40)
    expect(ast).toEqual(originalAst)
    expect(excerptAst).not.toEqual(originalAst)
    expect(excerptAst).toMatchSnapshot()
  })
})

describe('literal boundaries', function () {
  const createAst = (): Root => {
    const emphasis: Parent = {
      type: 'emphasis',
      children: [{ type: 'text', value: 'cdefgh' } as Literal],
    }
    const paragraph: Parent = {
      type: 'paragraph',
      children: [
        { type: 'text', value: 'ab' } as Literal,
        emphasis,
        { type: 'text', value: 'ignored' } as Literal,
      ],
    }
    return { type: 'root', children: [paragraph] }
  }

  test('truncates a nested crossing literal without mutating the input', function () {
    const ast = createAst()

    expect(calcExcerptAst(ast, 5)).toEqual({
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            { type: 'text', value: 'ab' },
            {
              type: 'emphasis',
              children: [{ type: 'text', value: 'cde' }],
            },
          ],
        },
      ],
    })
    expect(ast).toEqual(createAst())
  })

  test('stops at an exact literal boundary', function () {
    const ast = createAst()

    expect(calcExcerptAst(ast, 2)).toEqual({
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'text', value: 'ab' }],
        },
      ],
    })
  })

  test('returns an empty root when the limit is zero', function () {
    expect(calcExcerptAst(createAst(), 0)).toEqual({ type: 'root', children: [] })
  })
})
