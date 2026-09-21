import type { Emphasis, Image, Paragraph, Root, Text } from '@yozora/ast'
import { ListType, ParagraphType, TextType } from '@yozora/ast'
import { describe, expect, test } from 'vitest'
import { loadJSONFixture } from 'vitest.setup'
import { collectInlineNodes, collectNodes, collectTexts, inlineNodeMatcher } from '../src'

describe('collectNodes', function () {
  test('basic1', function () {
    const originalAst: Readonly<Root> = loadJSONFixture('basic1.ast.json')
    const ast: Root = loadJSONFixture('basic1.ast.json')

    expect(collectNodes(ast, [TextType])).toMatchSnapshot()
    expect(collectNodes(ast, [ParagraphType, ListType])).toMatchSnapshot()
    expect(ast).toEqual(originalAst)
  })
})

describe('collectInlineNodes', function () {
  test('collects outermost inline nodes in source order without changing the AST', function () {
    const first: Text = { type: 'text', value: 'first' }
    const nested: Text = { type: 'text', value: 'nested' }
    const emphasis: Emphasis = { type: 'emphasis', children: [nested] }
    const image: Image = { type: 'image', url: '/image.png', alt: 'image' }
    const last: Text = { type: 'text', value: 'last' }
    const paragraph: Paragraph = { type: 'paragraph', children: [first, emphasis, image] }
    const tail: Paragraph = { type: 'paragraph', children: [last] }
    const ast: Root = { type: 'root', children: [paragraph, { type: 'thematicBreak' }, tail] }
    const original = structuredClone(ast)

    const nodes = collectInlineNodes(ast)

    expect(nodes).toEqual([first, emphasis, image, last])
    expect(nodes[1]).toBe(emphasis)
    expect(nodes).not.toContain(nested)
    expect(ast).toEqual(original)
    expect(inlineNodeMatcher(paragraph)).toBe(false)
    expect(inlineNodeMatcher({ type: 'custom' })).toBe(false)
  })

  test('returns no inline nodes for an empty root', function () {
    expect(collectInlineNodes({ type: 'root', children: [] })).toEqual([])
  })
})

describe('collectTexts', function () {
  test('ignores blank image alternatives and trims nonempty text', function () {
    const image: Image = { type: 'image', url: '/image.png', alt: ' \n\t ' }
    const text: Text = { type: 'text', value: ' kept ' }

    expect(collectTexts([image, text])).toEqual(['kept'])
    expect(image.alt).toBe(' \n\t ')
    expect(text.value).toBe(' kept ')
  })
})
