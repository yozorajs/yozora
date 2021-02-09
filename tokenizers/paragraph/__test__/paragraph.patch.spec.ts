import type { NodePoint } from '@yozora/character'
import type {
  PhrasingContentLine,
  PhrasingContentPostMatchPhaseState,
} from '@yozora/tokenizercore-block'
import type {
  ParagraphMatchPhaseState,
  ParagraphPostMatchPhaseState,
} from '../src/types'
import { createNodePointGenerator } from '@yozora/character'
import {
  calcEndYastNodePoint,
  calcStartYastNodePoint,
} from '@yozora/tokenizercore'
import {
  PhrasingContentType,
  mergeContentLinesAndStrippedLines,
} from '@yozora/tokenizercore-block'
import { ParagraphTokenizer } from '../src/tokenizer'
import { ParagraphType } from '../src/types'


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
    }
  ]

  const nextLines: ReadonlyArray<PhrasingContentLine> = [
    {
      nodePoints,
      startIndex: 14,
      endIndex: 20,
      firstNonWhitespaceIndex: 14,
    }
  ]

  const ms: ParagraphMatchPhaseState = {
    type: ParagraphType,
    lines: [...lines],
  }

  const pms: ParagraphPostMatchPhaseState = {
    type: ParagraphType,
    lines: [...lines],
    position: {
      start: calcStartYastNodePoint(nodePoints, lines[0].startIndex),
      end: calcEndYastNodePoint(nodePoints, lines[0].endIndex - 1),
    }
  }

  it('extractPhrasingContentLines', function () {
    expect(tokenizer.extractPhrasingContentLines(ms))
      .toEqual(lines)
  })

  it('buildPostMatchPhaseState', function () {
    expect(tokenizer.buildPostMatchPhaseState(nextLines))
      .toEqual({
        type: ParagraphType,
        lines: nextLines,
        position: {
          start: calcStartYastNodePoint(nodePoints, nextLines[0].startIndex),
          end: calcEndYastNodePoint(nodePoints, nextLines[0].endIndex - 1),
        }
      })
  })

  it('buildPhrasingContent', function () {
    const phrasingContentPS: PhrasingContentPostMatchPhaseState = {
      ...pms,
      type: PhrasingContentType,
    }
    expect(tokenizer.buildPhrasingContent(phrasingContentPS))
      .toEqual({
        type: PhrasingContentType,
        contents: mergeContentLinesAndStrippedLines(phrasingContentPS.lines)
      })
  })
})
