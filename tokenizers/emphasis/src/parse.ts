import type { IParseInlineHookCreator } from '@yozora/core-tokenizer'
import type { INode, IThis, IToken, T } from './types'

export const parse: IParseInlineHookCreator<T, IToken, INode, IThis> = function () {
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
