import { TextType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import { calcEscapedStringFromNodePoints } from '@yozora/character'
import type { IParseInlineHookCreator } from '@yozora/core-tokenizer'
import type { INode, IThis, IToken, T } from './types'

export const parse: IParseInlineHookCreator<T, IToken, INode, IThis> = function (api) {
  return {
    parse: tokens =>
      tokens.map(token => {
        const nodePoints: ReadonlyArray<INodePoint> = api.getNodePoints()
        const { startIndex, endIndex } = token
        let value: string = calcEscapedStringFromNodePoints(nodePoints, startIndex, endIndex)

        /**
         * Spaces at the end of the line and beginning of the next line are removed
         * @see https://github.github.com/gfm/#example-670
         */
        value = value.replace(/[^\S\n]*\n[^\S\n]*/g, '\n')
        const node: INode = api.shouldReservePosition
          ? { type: TextType, position: api.calcPosition(token), value }
          : { type: TextType, value }
        return node
      }),
  }
}
