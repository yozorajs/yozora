import { DeleteType } from '@yozora/ast'
import type { IParseInlineHookCreator } from '@yozora/core-tokenizer'
import type { IHookContext, INode, IToken, T } from './types'

export const parse: IParseInlineHookCreator<T, IToken, INode, IHookContext> = function () {
  return {
    parse: (_token, children) => {
      const result: INode = {
        type: DeleteType,
        children,
      }
      return result
    },
  }
}
