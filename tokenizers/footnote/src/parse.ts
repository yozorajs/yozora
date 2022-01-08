import { FootnoteType } from '@yozora/ast'
import type { IParseInlineHookCreator } from '@yozora/core-tokenizer'
import type { IHookContext, INode, IToken, T } from './types'

export const parse: IParseInlineHookCreator<T, IToken, INode, IHookContext> = function (api) {
  return {
    parse: (_token, children) => ({
      type: FootnoteType,
      children,
    }),
  }
}
