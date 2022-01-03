import { calcStringFromNodePoints } from '@yozora/character'
import type { IParseBlockHookCreator } from '@yozora/core-tokenizer'
import { mergeContentLinesFaithfully } from '@yozora/core-tokenizer'
import type { IHookContext, INode, IToken, T } from './types'

export const parse: IParseBlockHookCreator<T, IToken, INode, IHookContext> = function () {
  return {
    parse: token => {
      // Try to build phrasingContent
      const contents = mergeContentLinesFaithfully(token.lines)
      const node: INode = {
        type: 'html',
        value: calcStringFromNodePoints(contents),
      }
      return node
    },
  }
}
