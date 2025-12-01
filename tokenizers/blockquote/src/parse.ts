import type { Node } from '@yozora/ast'
import { BlockquoteType } from '@yozora/ast'
import type { IParseBlockHookCreator } from '@yozora/core-tokenizer'
import type { INode, IThis, IToken, T } from './types'

export const parse: IParseBlockHookCreator<T, IToken, INode, IThis> = function (api) {
  return {
    parse: tokens =>
      tokens.map(token => {
        const children: Node[] = api.parseBlockTokens(token.children)
        const node: INode = api.shouldReservePosition
          ? { type: BlockquoteType, position: token.position, children }
          : { type: BlockquoteType, children }
        if (token.callout) node.callout = token.callout
        return node
      }),
  }
}
