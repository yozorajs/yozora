import type { Node } from '@yozora/ast'
import { LinkReferenceType } from '@yozora/ast'
import type { IParseInlineHookCreator } from '@yozora/core-tokenizer'
import type { INode, IThis, IToken, T } from './types'

export const parse: IParseInlineHookCreator<T, IToken, INode, IThis> = function (api) {
  return {
    parse: (tokens, ctx) =>
      tokens.map(token => {
        const { identifier, label, referenceType } = token
        const children: Node[] = ctx.getChildren(token)
        const node: INode = api.shouldReservePosition
          ? {
              type: LinkReferenceType,
              position: api.calcPosition(token),
              identifier,
              label,
              referenceType,
              children,
            }
          : {
              type: LinkReferenceType,
              identifier,
              label,
              referenceType,
              children,
            }
        return node
      }),
  }
}
