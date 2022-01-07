import type { IYastNode } from '@yozora/ast'
import { ListItemType } from '@yozora/ast'
import type { IParseBlockHookCreator } from '@yozora/core-tokenizer'
import type { IHookContext, INode, IToken, T } from './types'

export const parse: IParseBlockHookCreator<T, IToken, INode, IHookContext> = function (api) {
  return {
    parse: tokens =>
      tokens.map(token => {
        const children: IYastNode[] = token.children ? api.parseBlockTokens(token.children) : []
        const node: INode = {
          type: ListItemType,
          position: token.position,
          status: token.status,
          children,
        }
        return node
      }),
  }
}
