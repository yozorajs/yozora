import { TextType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import { calcEscapedStringFromNodePoints } from '@yozora/character'
import type { IParseInlineHookCreator } from '@yozora/core-tokenizer'
import type { INode, IThis, IToken, T } from './types'

export const parse: IParseInlineHookCreator<T, IToken, INode, IThis> = function (api) {
  return {
    parse: tokens =>
      tokens.map(token => {
        const nodePoints: readonly INodePoint[] = api.getNodePoints()
        let value = calcEscapedStringFromNodePoints(nodePoints, token.startIndex, token.endIndex)
        value = stripSpaces(value)
        const node: INode = api.shouldReservePosition
          ? { type: TextType, position: api.calcPosition(token), value }
          : { type: TextType, value }
        return node
      }),
  }
}

/**
 * Spaces at the end of the line and beginning of the next line are removed
 * @see https://github.github.com/gfm/#example-670
 */
const _stripRegex = /[^\S\n]*\n[^\S\n]*/g
const stripSpaces = (text: string): string => {
  return text.replace(_stripRegex, '\n')
}
