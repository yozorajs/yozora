import { MathType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import { calcStringFromNodePoints } from '@yozora/character'
import { mergeContentLinesFaithfully } from '@yozora/core-tokenizer'
import type { IParseBlockHookCreator } from '@yozora/core-tokenizer'
import type { INode, IThis, IToken, T } from './types'

export const parse: IParseBlockHookCreator<T, IToken, INode, IThis> = function (api) {
  return {
    parse: tokens =>
      tokens.map(token => {
        const contents: INodePoint[] = mergeContentLinesFaithfully(token.lines)

        /**
         * Backslash escape works in info strings in fenced code blocks.
         * @see https://github.github.com/gfm/#example-320
         */
        const value: string = calcStringFromNodePoints(contents)
        const node: INode = api.shouldReservePosition
          ? { type: MathType, position: token.position, value }
          : { type: MathType, value }
        return node
      }),
  }
}
