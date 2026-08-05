import type { Node } from '@yozora/ast'
import { FootnoteDefinitionType } from '@yozora/ast'
import type { IParseBlockHookCreator } from '@yozora/core-tokenizer'
import type { INode, IThis, IToken, T } from './types'

export const parse: IParseBlockHookCreator<T, IToken, INode, IThis> = function (api) {
  return {
    parse: function* (tokens) {
      const nodes: INode[] = []
      for (const token of tokens) {
        const label: string = token._label!
        const identifier: string = token._identifier!

        const children: Node[] = yield api.requestBlockTokens(token.children)
        const node: INode = api.shouldReservePosition
          ? {
              type: FootnoteDefinitionType,
              position: token.position,
              identifier,
              label,
              children,
            }
          : {
              type: FootnoteDefinitionType,
              identifier,
              label,
              children,
            }
        nodes.push(node)
      }
      return nodes
    },
  }
}
