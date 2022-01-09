import type { IYastNode } from '@yozora/ast'
import { ImageReferenceType } from '@yozora/ast'
import type { IParseInlineHookCreator } from '@yozora/core-tokenizer'
import { calcImageAlt } from '@yozora/tokenizer-image'
import type { INode, IThis, IToken, T } from './types'

export const parse: IParseInlineHookCreator<T, IToken, INode, IThis> = function (api) {
  return {
    parse: tokens =>
      tokens.map(token => {
        const { identifier, label, referenceType } = token

        // calc alt
        const children: IYastNode[] = api.parseInlineTokens(token.children)
        const alt = calcImageAlt(children)

        const node: INode = {
          type: ImageReferenceType,
          position: api.calcPosition(token),
          identifier,
          label,
          referenceType,
          alt,
        }
        return node
      }),
  }
}
