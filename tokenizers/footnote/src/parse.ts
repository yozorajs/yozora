import type { IYastNode } from '@yozora/ast'
import { FootnoteType } from '@yozora/ast'
import type { IParseInlineHookCreator } from '@yozora/core-tokenizer'
import type { INode, IThis, IToken, T } from './types'

export const parse: IParseInlineHookCreator<T, IToken, INode, IThis> = function (api) {
  return {
    parse: tokens =>
      tokens.map(token => {
        const children: IYastNode[] = api.parseInlineTokens(token.children)
        const node: INode = api.shouldReservePosition
          ? { type: FootnoteType, position: api.calcPosition(token), children }
          : { type: FootnoteType, children }
        return node
      }),
  }
}
