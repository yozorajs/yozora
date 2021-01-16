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
  mergeContentLines,
} from '@yozora/tokenizercore-block'
import { ParagraphTokenizer } from '../src/tokenizer'
import { ParagraphType } from '../src/types'


describe('paragraph patch test', function () {
  const tokenizer = new ParagraphTokenizer()

  const lines: ReadonlyArray<PhrasingContentLine> = [
    {
      firstNonWhiteSpaceIndex: 0,
      nodePoints: calcEnhancedYastNodePoints('hello, world!'),
    }
  ]

  const nextLines: ReadonlyArray<PhrasingContentLine> = [
    {
      firstNonWhiteSpaceIndex: 0,
      nodePoints: calcEnhancedYastNodePoints('hello,'),
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
      start: calcStartYastNodePoint(lines[0].nodePoints, 0),
      end: calcEndYastNodePoint(lines[0].nodePoints, lines[0].nodePoints.length - 1),
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
    expect(tokenizer.buildPostMatchPhaseState(pms, nextLines))
      .toEqual({
        type: ParagraphType,
        lines: nextLines,
        position: {
          start: calcStartYastNodePoint(nextLines[0].nodePoints, 0),
          end: calcEndYastNodePoint(nextLines[0].nodePoints, nextLines[0].nodePoints.length - 1),
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
        contents: mergeContentLines(phrasingContentPS.lines)
      })
  })
})
