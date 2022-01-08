import { HtmlType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import { calcStringFromNodePoints } from '@yozora/character'
import type { IParseInlineHookCreator } from '@yozora/core-tokenizer'
import type { IHookContext, INode, IToken, T } from './types'

export const parse: IParseInlineHookCreator<T, IToken, INode, IHookContext> = function (api) {
  return {
    parse: token => {
      const { startIndex, endIndex } = token
      const nodePoints: ReadonlyArray<INodePoint> = api.getNodePoints()
      const value = calcStringFromNodePoints(nodePoints, startIndex, endIndex)
      const result: INode = { type: HtmlType, value }
      return result
    },
  }
}
