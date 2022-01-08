import type { IParseInlineHookCreator } from '@yozora/core-tokenizer'
import type { IHookContext, INode, IToken, T } from './types'

export const parse: IParseInlineHookCreator<T, IToken, INode, IHookContext> = function () {
  return {
    parse: (token, children) => {
      const result: INode = {
        type: token.nodeType,
        children,
      }
      return result
    },
  }
}
