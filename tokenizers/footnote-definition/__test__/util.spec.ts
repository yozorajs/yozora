import type { INodePoint } from '@yozora/character'
import { createNodePointGenerator } from '@yozora/character'
import { eatFootnoteLabel } from '../src'

function labelOfContent(content: string): number {
  const nodePoints: INodePoint[] = [...createNodePointGenerator(content)].flat()
  return eatFootnoteLabel(nodePoints, 0, nodePoints.length)
}

test('Backslash', function () {
  expect(labelOfContent('[^valid footnote\\] \\[ \\] label\\]]')).toEqual(33)
  expect(labelOfContent('[^invalid footnote []')).toEqual(-1)
})

test('Footnote label should in same line', function () {
  expect(labelOfContent('[^valid footnote]')).toEqual(17)
  expect(labelOfContent('[^invalid \n footnote]')).toEqual(-1)
  expect(labelOfContent('[^invalid footnote\n]')).toEqual(-1)
})

test('Unclosed', function () {
  expect(labelOfContent('[^valid footnote')).toEqual(-1)
})

test('Empty label is not allowed', function () {
  expect(labelOfContent('[^   ]')).toEqual(-1)
})
