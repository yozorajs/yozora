import { BreakType } from '@yozora/ast'
import type { IParseInlineHookCreator } from '@yozora/core-tokenizer'
import type { INode, IThis, IToken, T } from './types'

export const parse: IParseInlineHookCreator<T, IToken, INode, IThis> = function (api) {
  return {
    parse: tokens =>
      tokens.map(token => {
        const node: INode = api.shouldReservePosition
          ? { type: BreakType, position: api.calcPosition(token) }
          : { type: BreakType }
        return node
      }),
  }
}
