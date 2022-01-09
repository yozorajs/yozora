import { FootnoteReferenceType } from '@yozora/ast'
import type { IParseInlineHookCreator } from '@yozora/core-tokenizer'
import type { INode, IThis, IToken, T } from './types'

export const parse: IParseInlineHookCreator<T, IToken, INode, IThis> = function (api) {
  return {
    parse: tokens =>
      tokens.map(token => {
        const { identifier, label } = token
        const node: INode = {
          type: FootnoteReferenceType,
          position: api.calcPosition(token),
          identifier,
          label,
        }
        return node
      }),
  }
}
