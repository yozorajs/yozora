import { EmphasisType, ParagraphType, StrongType, TextType } from '@yozora/ast'
import { createNodeMatcher, createShallowNodeCollector } from '../src'

describe('createNodeTypeMatcher', function () {
  test('null', function () {
    const match = createNodeMatcher(null)
    expect(match({ type: TextType })).toBe(true)
    expect(match({ type: EmphasisType })).toBe(true)
    expect(match({ type: StrongType })).toBe(true)
    expect(match({ type: ParagraphType })).toBe(true)
  })

  test('length of 0', function () {
    const match = createNodeMatcher([])
    expect(match({ type: TextType })).toBe(false)
    expect(match({ type: EmphasisType })).toBe(false)
    expect(match({ type: StrongType })).toBe(false)
    expect(match({ type: ParagraphType })).toBe(false)
  })

  test('length of 1', function () {
    const match = createNodeMatcher([TextType])
    expect(match({ type: TextType })).toBe(true)
    expect(match({ type: EmphasisType })).toBe(false)
    expect(match({ type: StrongType })).toBe(false)
    expect(match({ type: ParagraphType })).toBe(false)
  })

  test('length of 2', function () {
    const match = createNodeMatcher([TextType, EmphasisType])
    expect(match({ type: TextType })).toBe(true)
    expect(match({ type: EmphasisType })).toBe(true)
    expect(match({ type: StrongType })).toBe(false)
    expect(match({ type: ParagraphType })).toBe(false)
  })

  test('length of 3', function () {
    const match = createNodeMatcher([TextType, EmphasisType, StrongType])
    expect(match({ type: TextType })).toBe(true)
    expect(match({ type: EmphasisType })).toBe(true)
    expect(match({ type: StrongType })).toBe(true)
    expect(match({ type: ParagraphType })).toBe(false)
  })
})

describe('createShallowNodeCollector', function () {
  describe('basic', function () {
    const originalNodes: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const nodes: number[] = [...originalNodes]

    test('full', function () {
      const collector = createShallowNodeCollector(nodes)
      for (let i = 0; i < nodes.length; ++i) collector.add(nodes[i])
      expect(collector.collect()).toBe(nodes)
      expect(nodes).toEqual(originalNodes)
    })

    test('skip', function () {
      const collector = createShallowNodeCollector(nodes)
      const pos = 5
      for (let i = 0; i < nodes.length; ++i) {
        const val = nodes[i]
        const nextVal = i === pos ? -val : val
        collector.conditionalAdd(nextVal, val, i)
      }
      expect(collector.collect()).toEqual(nodes.map((x, i) => (i === pos ? -x : x)))
      expect(nodes).toEqual(originalNodes)
    })

    test('misc', function () {
      const collector = createShallowNodeCollector(nodes)
      const pos = 3
      for (let i = 0; i < nodes.length; ++i) {
        const val = nodes[i]
        if (i === pos) {
          const nextVal = i === pos ? -val : val
          collector.conditionalAdd(nextVal, val, i)
        } else Math.random() > 0.5 ? collector.add(val) : collector.conditionalAdd(val, val, i)
      }
      expect(collector.collect()).toEqual(nodes.map((x, i) => (i === pos ? -x : x)))
      expect(nodes).toEqual(originalNodes)
    })
  })
})
