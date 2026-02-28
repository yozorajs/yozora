import { ParagraphType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import { createNodePointGenerator } from '@yozora/character'
import type { IPhrasingContentLine } from '@yozora/core-tokenizer'
import {
  calcEndPoint,
  calcPositionFromPhrasingContentLines,
  calcStartPoint,
} from '@yozora/core-tokenizer'
import type { IParagraphToken } from '../src'
import { ParagraphTokenizer, ParagraphTokenizerName } from '../src'

describe('paragraph patch test', function () {
  const tokenizer = new ParagraphTokenizer()
  const nodePointIterator = createNodePointGenerator(['hello, world!\nhello,'])
  const nodePoints: INodePoint[] = [...nodePointIterator].flat()

  const lines: readonly IPhrasingContentLine[] = [
    {
      nodePoints,
      startIndex: 0,
      endIndex: 14,
      firstNonWhitespaceIndex: 0,
      countOfPrecedeSpaces: 0,
    },
  ]

  const nextLines: readonly IPhrasingContentLine[] = [
    {
      nodePoints,
      startIndex: 14,
      endIndex: 20,
      firstNonWhitespaceIndex: 14,
      countOfPrecedeSpaces: 0,
    },
  ]

  const token: IParagraphToken = {
    _tokenizer: ParagraphTokenizerName,
    nodeType: ParagraphType,
    lines: [...lines],
    position: calcPositionFromPhrasingContentLines(lines),
  }

  it('extractPhrasingContentLines', function () {
    expect(tokenizer.extractPhrasingContentLines(token)).toEqual(lines)
  })

  it('buildBlockState', function () {
    expect(tokenizer.buildBlockToken([])).toBeNull()
    expect(tokenizer.buildBlockToken(nextLines)).toEqual({
      nodeType: ParagraphType,
      lines: nextLines,
      position: {
        start: calcStartPoint(nodePoints, nextLines[0].startIndex),
        end: calcEndPoint(nodePoints, nextLines[0].endIndex - 1),
      },
    })
  })
})
