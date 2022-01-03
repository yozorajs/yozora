import { ParagraphType } from '@yozora/ast'
import type { IParseBlockHookCreator } from '@yozora/core-tokenizer'
import type { IHookContext, INode, IToken, T } from './types'

export const parse: IParseBlockHookCreator<T, IToken, INode, IHookContext> = function (api) {
  return {
    parse: token => {
      const phrasingContent = api.buildPhrasingContent(token.lines)
      if (phrasingContent == null) return null

      const node: INode = {
        type: ParagraphType,
        children: [phrasingContent],
      }
      return node
    },
  }
}
