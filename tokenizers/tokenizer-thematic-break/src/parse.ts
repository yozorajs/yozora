import { ThematicBreakType } from '@yozora/ast'
import type { IParseBlockHookCreator } from '@yozora/tokenizer'
import type { INode, IThis, IToken, T } from './types'

export const parse: IParseBlockHookCreator<T, IToken, INode, IThis> = function (api) {
  return {
    parse: tokens =>
      tokens.map(token => {
        const node: INode = api.shouldReservePosition
          ? { type: ThematicBreakType, position: token.position }
          : { type: ThematicBreakType }
        return node
      }),
  }
}
