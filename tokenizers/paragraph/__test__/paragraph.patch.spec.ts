import type {
  PhrasingContentLine,
  PhrasingContentPostMatchPhaseState,
} from '@yozora/tokenizercore-block'
import type {
  ParagraphMatchPhaseState,
  ParagraphPostMatchPhaseState,
} from '../src/types'
import {
  calcEndYastNodePoint,
  calcEnhancedYastNodePoints,
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
  const nodePoints = calcEnhancedYastNodePoints('hello, world!\nhello,')

  const lines: ReadonlyArray<PhrasingContentLine> = [
    {
      startIndex: 0,
      endIndex: 14,
      firstNonWhiteSpaceIndex: 0,
    }
  ]

  const nextLines: ReadonlyArray<PhrasingContentLine> = [
    {
      startIndex: 14,
      endIndex: 20,
      firstNonWhiteSpaceIndex: 14,
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

  it('buildMatchPhaseState', function () {
    expect(tokenizer.buildMatchPhaseState(ms, nextLines))
      .toEqual({ type: ParagraphType, lines: nextLines })
  })

  it('buildPostMatchPhaseState', function () {
    expect(tokenizer.buildPostMatchPhaseState(nodePoints, pms, nextLines))
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
    expect(tokenizer.buildPhrasingContent(nodePoints, phrasingContentPS))
      .toEqual({
        type: PhrasingContentType,
        contents: mergeContentLinesAndStrippedLines(nodePoints, phrasingContentPS.lines)
      })
  })
})
