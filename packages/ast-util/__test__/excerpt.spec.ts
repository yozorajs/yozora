import type { Literal, Paragraph, Parent, Root, Text } from '@yozora/ast'
import { describe, expect, test } from 'vitest'
import { loadJSONFixture } from 'vitest.setup'
import { calcExcerptAst, getExcerptAst } from '../src'

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

  test('does not split a surrogate pair at the truncation boundary', function () {
    const ast: Root = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'text', value: 'a😀b' } as Literal],
        } as Parent,
      ],
    }

    expect(calcExcerptAst(ast, 2)).toEqual({
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'text', value: 'a' }],
        },
      ],
    })
    expect((ast.children[0] as Parent).children[0]).toEqual({ type: 'text', value: 'a😀b' })
  })

  test('returns an empty root when the limit is zero', function () {
    expect(calcExcerptAst(createAst(), 0)).toEqual({ type: 'root', children: [] })
  })

  test('reuses an empty root', function () {
    const ast: Root = { type: 'root', children: [] }

    expect(calcExcerptAst(ast, 10)).toBe(ast)
  })

  test('omits a literal when the remaining limit cannot hold its first code point', function () {
    const first: Text = { type: 'text', value: 'ab' }
    const next: Text = { type: 'text', value: '😀tail' }
    const paragraph: Paragraph = { type: 'paragraph', children: [first, next] }
    const ast: Root = { type: 'root', children: [paragraph] }
    const original = structuredClone(ast)

    expect(calcExcerptAst(ast, 3)).toEqual({
      type: 'root',
      children: [{ type: 'paragraph', children: [first] }],
    })
    expect(ast).toEqual(original)
  })
})

describe('excerpt separator', function () {
  test('falls back to the length limit when the separator is absent', function () {
    const text: Text = { type: 'text', value: 'abcdef' }
    const paragraph: Paragraph = { type: 'paragraph', children: [text] }
    const ast: Root = { type: 'root', children: [paragraph] }
    const original = structuredClone(ast)

    expect(getExcerptAst(ast, 3, '<!-- more -->')).toEqual({
      type: 'root',
      children: [{ type: 'paragraph', children: [{ type: 'text', value: 'abc' }] }],
    })
    expect(ast).toEqual(original)
  })

  test.each(['', '   '])('ignores empty separator %j', function (separator) {
    const ast: Root = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            { type: 'text', value: 'before' } as Literal,
            { type: 'text', value: ' ' } as Literal,
            { type: 'text', value: 'after' } as Literal,
          ],
        } as Parent,
      ],
    }

    expect(getExcerptAst(ast, 100, separator)).toEqual(ast)
  })

  test('excludes a root-level separator and following siblings without mutating the input', function () {
    const ast: Root = {
      type: 'root',
      children: [
        { type: 'paragraph', children: [{ type: 'text', value: 'before' } as Literal] } as Parent,
        { type: 'html', value: '<!-- more -->' } as Literal,
        { type: 'paragraph', children: [{ type: 'text', value: 'after' } as Literal] } as Parent,
      ],
    }

    expect(getExcerptAst(ast, 100, '<!-- more -->')).toEqual({
      type: 'root',
      children: [{ type: 'paragraph', children: [{ type: 'text', value: 'before' }] }],
    })
    expect(ast).toEqual({
      type: 'root',
      children: [
        { type: 'paragraph', children: [{ type: 'text', value: 'before' }] },
        { type: 'html', value: '<!-- more -->' },
        { type: 'paragraph', children: [{ type: 'text', value: 'after' }] },
      ],
    })
  })

  test('preserves ancestors before a nested separator without mutating the input', function () {
    const ast: Root = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            { type: 'text', value: 'before' } as Literal,
            { type: 'text', value: '<!-- more -->' } as Literal,
            { type: 'text', value: 'after' } as Literal,
          ],
        } as Parent,
        { type: 'paragraph', children: [{ type: 'text', value: 'later' } as Literal] } as Parent,
      ],
    }

    expect(getExcerptAst(ast, 100, '<!-- more -->')).toEqual({
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'text', value: 'before' }],
        },
      ],
    })
    expect(ast).toEqual({
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            { type: 'text', value: 'before' },
            { type: 'text', value: '<!-- more -->' },
            { type: 'text', value: 'after' },
          ],
        },
        { type: 'paragraph', children: [{ type: 'text', value: 'later' }] },
      ],
    })
  })
})
