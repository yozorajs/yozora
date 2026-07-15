import type { Node } from '@yozora/ast'
import type { IParseInlineHookCreator } from '@yozora/core-tokenizer'
import type { INode, IThis, IToken, T } from './types'

export const parse: IParseInlineHookCreator<T, IToken, INode, IThis> = function (api) {
  return {
    parse: (tokens, ctx) =>
      tokens.map(token => {
        const children: Node[] = ctx.getChildren(token)
        const node: INode = api.shouldReservePosition
          ? { type: token.nodeType, position: api.calcPosition(token), children }
          : { type: token.nodeType, children }
        return node
      }),
  }
}
