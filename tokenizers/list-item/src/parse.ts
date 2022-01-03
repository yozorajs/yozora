import { ListItemType } from '@yozora/ast'
import type { IParseBlockHookCreator } from '@yozora/core-tokenizer'
import type { IHookContext, INode, IToken, T } from './types'

export const parse: IParseBlockHookCreator<T, IToken, INode, IHookContext> = function () {
  return {
    parse: (token, children) => {
      const node: INode = {
        type: ListItemType,
        status: token.status,
        children,
      }
      return node
    },
  }
}
