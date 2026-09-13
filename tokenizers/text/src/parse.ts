import { TextType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import {
  AsciiCodePoint,
  VirtualCodePoint,
  calcEscapedStringFromNodePoints,
  isSpaceCharacter,
} from '@yozora/character'
import type { IParseInlineHookCreator } from '@yozora/core-tokenizer'
import type { INode, IThis, IToken, T } from './types'

export const parse: IParseInlineHookCreator<T, IToken, INode, IThis> = function (api) {
  return {
    parse: tokens =>
      tokens.map(token => {
        const nodePoints: readonly INodePoint[] = api.getNodePoints()
        const value = calcTextValue(nodePoints, token.startIndex, token.endIndex)
        const node: INode = api.shouldReservePosition
          ? { type: TextType, position: api.calcPosition(token), value }
          : { type: TextType, value }
        return node
      }),
  }
}

/**
 * Trim source spaces and tabs around line endings before decoding entities.
 * Entity-generated whitespace must remain literal text:
 *
 * ```text
 * Source: a &#10; b
 * Value:  "a \n b"
 * ```
 *
 * Decode each retained range separately so encoded spaces, tabs, and newlines
 * cannot be mistaken for source whitespace. Each point is visited O(1) times.
 */
function calcTextValue(
  nodePoints: readonly INodePoint[],
  startIndex: number,
  endIndex: number,
): string {
  let value = ''
  let i = startIndex
  while (i < endIndex) {
    const c = nodePoints[i].codePoint
    i += 1
    if (c !== VirtualCodePoint.LINE_END && c !== AsciiCodePoint.LF) continue

    let lineEndIndex = i - 1
    for (; lineEndIndex > startIndex; lineEndIndex -= 1) {
      const c = nodePoints[lineEndIndex - 1].codePoint
      if (!isSpaceCharacter(c) && c !== AsciiCodePoint.HT) break
    }
    value += calcEscapedStringFromNodePoints(nodePoints, startIndex, lineEndIndex) + '\n'

    for (; i < endIndex; ++i) {
      const c = nodePoints[i].codePoint
      if (!isSpaceCharacter(c) && c !== AsciiCodePoint.HT) break
    }
    startIndex = i
  }
  return value + calcEscapedStringFromNodePoints(nodePoints, startIndex, endIndex)
}
