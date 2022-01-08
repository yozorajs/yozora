import { LinkReferenceType } from '@yozora/ast'
import type { IParseInlineHookCreator } from '@yozora/core-tokenizer'
import type { INode, IThis, IToken, T } from './types'

export const parse: IParseInlineHookCreator<T, IToken, INode, IThis> = function () {
  return {
    parse: (token, children) => {
      const { identifier, label, referenceType } = token
      const result: INode = {
        type: LinkReferenceType,
        identifier,
        label,
        referenceType,
        children,
      }
      return result
    },
  }
}
