import type { Node } from '@yozora/ast'
import { HeadingType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import {
  AsciiCodePoint,
  calcTrimBoundaryOfCodePoints,
  isWhitespaceCharacter,
} from '@yozora/character'
import type { IParseBlockHookCreator, IPhrasingContentLine } from '@yozora/core-tokenizer'
import { mergeAndStripContentLines } from '@yozora/core-tokenizer'
import type { INode, IThis, IToken, T } from './types'

export const parse: IParseBlockHookCreator<T, IToken, INode, IThis> = function (api) {
  return {
    parse: tokens =>
      tokens.map(token => {
        const { nodePoints, firstNonWhitespaceIndex, endIndex } = token.line

        /**
         * Leading and trailing whitespace is ignored in parsing inline content
         * Spaces are allowed after the closing sequence
         * @see https://github.github.com/gfm/#example-37
         * @see https://github.github.com/gfm/#example-43
         */
        // eslint-disable-next-line prefer-const
        let [leftIndex, rightIndex] = calcTrimBoundaryOfCodePoints(
          nodePoints,
          firstNonWhitespaceIndex + token.depth,
          endIndex,
        )

        /**
         * A closing sequence of '#' characters is optional
         * It need not be the same length as the opening sequence
         * @see https://github.github.com/gfm/#example-41
         * @see https://github.github.com/gfm/#example-42
         * @see https://github.github.com/gfm/#example-44
         */
        let closeCharCount = 0
        for (let j = rightIndex - 1; j >= leftIndex; --j) {
          const c = nodePoints[j].codePoint
          if (c !== AsciiCodePoint.NUMBER_SIGN) break
          closeCharCount += 1
        }
        if (closeCharCount > 0) {
          let spaceCount = 0,
            j = rightIndex - 1 - closeCharCount
          for (; j >= leftIndex; --j) {
            const c = nodePoints[j].codePoint
            if (!isWhitespaceCharacter(c)) break
            spaceCount += 1
          }
          if (spaceCount > 0 || j < leftIndex) {
            rightIndex -= closeCharCount + spaceCount
          }
        }

        // Resolve phrasing content.
        const lines: IPhrasingContentLine[] = [
          {
            nodePoints,
            startIndex: leftIndex,
            endIndex: rightIndex,
            firstNonWhitespaceIndex: leftIndex,
            countOfPrecedeSpaces: 0,
          },
        ]

        // Resolve phrasing content.
        const contents: INodePoint[] = mergeAndStripContentLines(lines)
        const children: Node[] = api.processInlines(contents)

        const node: INode = api.shouldReservePosition
          ? { type: HeadingType, position: token.position, depth: token.depth, children }
          : { type: HeadingType, depth: token.depth, children }
        return node
      }),
  }
}
