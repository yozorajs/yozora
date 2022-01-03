import { HeadingType } from '@yozora/ast'
import {
  AsciiCodePoint,
  calcTrimBoundaryOfCodePoints,
  isWhitespaceCharacter,
} from '@yozora/character'
import type { IParseBlockHookCreator, IPhrasingContentLine } from '@yozora/core-tokenizer'
import type { IHookContext, INode, IToken, T } from './types'

export const parse: IParseBlockHookCreator<T, IToken, INode, IHookContext> = function (api) {
  return {
    parse: token => {
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
      const phrasingContent = api.buildPhrasingContent(lines)

      const node: INode = {
        type: HeadingType,
        depth: token.depth,
        children: phrasingContent == null ? [] : [phrasingContent],
      }
      return node
    },
  }
}
