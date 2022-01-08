import { FootnoteReferenceType } from '@yozora/ast'
import type { IParseInlineHookCreator } from '@yozora/core-tokenizer'
import type { INode, IThis, IToken, T } from './types'

export const parse: IParseInlineHookCreator<T, IToken, INode, IThis> = function (api) {
  return {
    parse: token => {
      const { identifier, label } = token
      const result: INode = {
        type: FootnoteReferenceType,
        identifier,
        label,
      }
      return result
    },
  }
}
