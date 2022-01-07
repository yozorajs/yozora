import type { IListItem, IYastNode } from '@yozora/ast'
import { ListType } from '@yozora/ast'
import type { IParseBlockHookCreator } from '@yozora/core-tokenizer'
import type { IHookContext, INode, IToken, T } from './types'

export const parse: IParseBlockHookCreator<T, IToken, INode, IHookContext> = function (api) {
  return {
    parse: tokens =>
      tokens.map(token => {
        const children: IYastNode[] = token.children ? api.parseBlockTokens(token.children) : []
        const node: INode = {
          type: ListType,
          position: token.position,
          ordered: token.ordered,
          orderType: token.orderType,
          start: token.start,
          marker: token.marker,
          spread: token.spread,
          children: children as IListItem[],
        }
        return node
      }),
  }
}
