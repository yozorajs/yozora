import { ImageReferenceType } from '@yozora/ast'
import type { IParseInlineHookCreator } from '@yozora/core-tokenizer'
import { calcImageAlt } from '@yozora/tokenizer-image'
import type { INode, IThis, IToken, T } from './types'

export const parse: IParseInlineHookCreator<T, IToken, INode, IThis> = function (api) {
  return {
    parse: (token, children) => {
      const { identifier, label, referenceType } = token

      // calc alt
      const alt = calcImageAlt(children)

      const result: INode = {
        type: ImageReferenceType,
        identifier,
        label,
        referenceType,
        alt,
      }
      return result
    },
  }
}
