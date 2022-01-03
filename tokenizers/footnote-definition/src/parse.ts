import { FootnoteDefinitionType } from '@yozora/ast'
import type { IParseBlockHookCreator } from '@yozora/core-tokenizer'
import type { IHookContext, INode, IToken, T } from './types'

export const parse: IParseBlockHookCreator<T, IToken, INode, IHookContext> = function () {
  return {
    parse: (token, children) => {
      const label: string = token._label!
      const identifier: string = token._identifier!

      const node: INode = {
        type: FootnoteDefinitionType,
        identifier,
        label,
        children,
      }
      return node
    },
  }
}
