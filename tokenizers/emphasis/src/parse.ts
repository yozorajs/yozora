import type { IYastNode } from '@yozora/ast'
import type { IParseInlineHookCreator } from '@yozora/core-tokenizer'
import type { INode, IThis, IToken, T } from './types'

export const parse: IParseInlineHookCreator<T, IToken, INode, IThis> = function (api) {
  return {
    parse: tokens =>
      tokens.map(token => {
        const children: IYastNode[] = token.children ? api.parseInlineTokens(token.children) : []
        const node: INode = {
          type: token.nodeType,
          position: api.calcPosition(token),
          children,
        }
        return node
      }),
  }
}
