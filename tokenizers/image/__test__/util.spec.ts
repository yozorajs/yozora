import type { Emphasis, Image, Text } from '@yozora/ast'
import { EmphasisType, ImageType, TextType } from '@yozora/ast'
import { calcImageAlt } from '../src'

test('collects literal values and nested image alt text in source order', () => {
  const text: Text = { type: TextType, value: 'foo' }
  const nestedText: Text = { type: TextType, value: 'bar' }
  const image: Image = { type: ImageType, url: '/image', alt: 'baz' }
  const emphasis: Emphasis = { type: EmphasisType, children: [nestedText, image] }

  expect(calcImageAlt([text, emphasis])).toBe('foobarbaz')
})

test('handles deeply nested nodes without recursive stack growth', () => {
  let node: Text | Emphasis = { type: TextType, value: 'value' }
  for (let i = 0; i < 10_000; ++i) {
    node = { type: EmphasisType, children: [node] }
  }

  expect(calcImageAlt([node])).toBe('value')
})
