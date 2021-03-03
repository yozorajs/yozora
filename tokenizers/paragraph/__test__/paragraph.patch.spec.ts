import type { NodePoint } from '@yozora/character'
import { createNodePointGenerator } from '@yozora/character'
import type { PhrasingContentLine } from '@yozora/core-tokenizer'
import {
  calcEndYastNodePoint,
  calcPositionFromPhrasingContentLines,
  calcStartYastNodePoint,
} from '@yozora/core-tokenizer'
import type { ParagraphState } from '../src'
import { ParagraphTokenizer, ParagraphType } from '../src'

describe('paragraph patch test', function () {
  const tokenizer = new ParagraphTokenizer()
  const nodePointGenerator = createNodePointGenerator('hello, world!\nhello,')
  const nodePoints: NodePoint[] = nodePointGenerator.next(null).value!

  const lines: ReadonlyArray<PhrasingContentLine> = [
    {
      nodePoints,
      startIndex: 0,
      endIndex: 14,
      firstNonWhitespaceIndex: 0,
      countOfPrecedeSpaces: 0,
    },
  ]

  const nextLines: ReadonlyArray<PhrasingContentLine> = [
    {
      nodePoints,
      startIndex: 14,
      endIndex: 20,
      firstNonWhitespaceIndex: 14,
      countOfPrecedeSpaces: 0,
    },
  ]

  const state: ParagraphState = {
    type: ParagraphType,
    lines: [...lines],
    position: calcPositionFromPhrasingContentLines(lines),
  }

  it('extractPhrasingContentLines', function () {
    expect(tokenizer.extractPhrasingContentLines(state)).toEqual(lines)
  })

  it('buildBlockState', function () {
    expect(tokenizer.buildBlockState([])).toBeNull()
    expect(tokenizer.buildBlockState(nextLines)).toEqual({
      type: ParagraphType,
      lines: nextLines,
      position: {
        start: calcStartYastNodePoint(nodePoints, nextLines[0].startIndex),
        end: calcEndYastNodePoint(nodePoints, nextLines[0].endIndex - 1),
      },
    })
  })
})
