import { ParagraphType } from '@yozora/ast'
import type { IParseBlockHookCreator } from '@yozora/core-tokenizer'
import type { INode, IThis, IToken, T } from './types'

export const parse: IParseBlockHookCreator<T, IToken, INode, IThis> = function (api) {
  return {
    parse: tokens => {
      const results: INode[] = []
      for (const token of tokens) {
        const phrasingContent = api.buildPhrasingContent(token.lines)
        if (phrasingContent == null) continue

        const node: INode = api.shouldReservePosition
          ? { type: ParagraphType, position: token.position, children: [phrasingContent] }
          : { type: ParagraphType, children: [phrasingContent] }
        results.push(node)
      }
      return results
    },
  }
}
