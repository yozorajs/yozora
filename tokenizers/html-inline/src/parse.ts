import { HtmlType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import { calcStringFromNodePoints } from '@yozora/character'
import type { IParseInlineHookCreator } from '@yozora/core-tokenizer'
import type { INode, IThis, IToken, T } from './types'

export const parse: IParseInlineHookCreator<T, IToken, INode, IThis> = function (api) {
  return {
    parse: tokens =>
      tokens.map(token => {
        const { startIndex, endIndex } = token
        const nodePoints: ReadonlyArray<INodePoint> = api.getNodePoints()
        const value = calcStringFromNodePoints(nodePoints, startIndex, endIndex)
        const node: INode = api.shouldReservePosition
          ? { type: HtmlType, position: api.calcPosition(token), value }
          : { type: HtmlType, value }
        return node
      }),
  }
}
