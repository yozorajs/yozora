import { MathType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import { calcStringFromNodePoints } from '@yozora/character'
import { mergeContentLinesFaithfully } from '@yozora/core-tokenizer'
import type { IParseBlockHookCreator } from '@yozora/core-tokenizer'
import type { IHookContext, INode, IToken, T } from './types'

export const parse: IParseBlockHookCreator<T, IToken, INode, IHookContext> = function () {
  return {
    parse: token => {
      const contents: INodePoint[] = mergeContentLinesFaithfully(token.lines)

      /**
       * Backslash escape works in info strings in fenced code blocks.
       * @see https://github.github.com/gfm/#example-320
       */
      const node: INode = {
        type: MathType,
        value: calcStringFromNodePoints(contents),
      }
      return node
    },
  }
}
