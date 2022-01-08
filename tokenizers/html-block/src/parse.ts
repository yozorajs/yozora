import { calcStringFromNodePoints } from '@yozora/character'
import type { IParseBlockHookCreator } from '@yozora/core-tokenizer'
import { mergeContentLinesFaithfully } from '@yozora/core-tokenizer'
import type { INode, IThis, IToken, T } from './types'

export const parse: IParseBlockHookCreator<T, IToken, INode, IThis> = function () {
  return {
    parse: tokens =>
      tokens.map(token => {
        // Try to build phrasingContent
        const contents = mergeContentLinesFaithfully(token.lines)
        const node: INode = {
          type: 'html',
          position: token.position,
          value: calcStringFromNodePoints(contents),
        }
        return node
      }),
  }
}
