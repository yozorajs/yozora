import type { Node } from '@yozora/ast'
import { BlockquoteType } from '@yozora/ast'
import type { IParseBlockHookCreator } from '@yozora/tokenizer'
import type { INode, IThis, IToken, T } from './types'

export const parse: IParseBlockHookCreator<T, IToken, INode, IThis> = function (api) {
  return {
    parse: function* (tokens) {
      const nodes: INode[] = []
      for (const token of tokens) {
        const children: Node[] = yield api.requestBlockTokens(token.children)
        const node: INode = api.shouldReservePosition
          ? { type: BlockquoteType, position: token.position, children }
          : { type: BlockquoteType, children }
        nodes.push(node)
      }
      return nodes
    },
  }
}
