import { InlineMathType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import { calcStringFromNodePoints, isSpaceLike } from '@yozora/character'
import type { IParseInlineHookCreator } from '@yozora/core-tokenizer'
import type { INode, IThis, IToken, T } from './types'

export const parse: IParseInlineHookCreator<T, IToken, INode, IThis> = function (api) {
  return {
    parse: tokens =>
      tokens.map(token => {
        const nodePoints: readonly INodePoint[] = api.getNodePoints()
        let startIndex: number = token.startIndex + token.thickness
        let endIndex: number = token.endIndex - token.thickness

        let isAllSpace = true
        for (let i = startIndex; i < endIndex; ++i) {
          if (isSpaceLike(nodePoints[i].codePoint)) continue
          isAllSpace = false
          break
        }

        /**
         * If the resulting string both begins and ends with a space character,
         * but doesn't consist entirely of space characters, a single space
         * character is removed from the front and back. This allows you to
         * include code that begins or endsWith backtick characters, which must
         * be separated by whitespace from the opening or closing backtick strings.
         * @see https://github.github.com/gfm/#example-340
         *
         * Only spaces, and not unicode whitespace in general, are stripped
         * in this way
         * @see https://github.github.com/gfm/#example-343
         *
         * No stripping occurs if the code span contains only spaces
         * @see https://github.github.com/gfm/#example-344
         */
        if (!isAllSpace && startIndex + 2 < endIndex) {
          const firstCharacter = nodePoints[startIndex].codePoint
          const lastCharacter = nodePoints[endIndex - 1].codePoint
          if (isSpaceLike(firstCharacter) && isSpaceLike(lastCharacter)) {
            startIndex += 1
            endIndex -= 1
          }
        }

        const value = calcStringFromNodePoints(nodePoints, startIndex, endIndex).replace(/\n/g, ' ')
        const node: INode = api.shouldReservePosition
          ? { type: InlineMathType, position: api.calcPosition(token), value }
          : { type: InlineMathType, value }
        return node
      }),
  }
}
