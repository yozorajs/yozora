import { HeadingType } from '@yozora/ast'
import { AsciiCodePoint, VirtualCodePoint, isUnicodeWhitespaceCharacter } from '@yozora/character'
import type {
  IMatchBlockHookCreator,
  IPhrasingContentLine,
  IResultOfEatAndInterruptPreviousSibling,
  IResultOfEatOpener,
  IYastBlockToken,
} from '@yozora/core-tokenizer'
import { calcEndYastNodePoint, calcStartYastNodePoint } from '@yozora/core-tokenizer'
import type { IThis, IToken, T } from './types'

/**
 * A setext heading consists of one or more lines of text, each containing
 * at least one non-whitespace character, with no more than 3 spaces
 * indentation, followed by a setext heading underline. The lines of text must
 * be such that, were they not followed by the setext heading underline, they
 * would be interpreted as a paragraph.
 *
 * @see https://github.github.com/gfm/#setext-heading
 */
export const match: IMatchBlockHookCreator<T, IToken, IThis> = function (api) {
  return {
    isContainingBlock: false,
    eatOpener,
    eatAndInterruptPreviousSibling,
  }

  function eatOpener(): IResultOfEatOpener<T, IToken> {
    return null
  }

  function eatAndInterruptPreviousSibling(
    line: Readonly<IPhrasingContentLine>,
    prevSiblingToken: Readonly<IYastBlockToken>,
  ): IResultOfEatAndInterruptPreviousSibling<T, IToken> {
    const { nodePoints, endIndex, firstNonWhitespaceIndex, countOfPrecedeSpaces } = line

    /**
     * Four spaces is too much
     * @see https://github.github.com/gfm/#example-55
     * @see https://github.github.com/gfm/#example-57
     */
    if (countOfPrecedeSpaces >= 4 || firstNonWhitespaceIndex >= endIndex) return null

    let marker: number | null = null,
      hasPotentialInternalSpace = false
    for (let i = firstNonWhitespaceIndex; i < endIndex; ++i) {
      const c = nodePoints[i]
      if (c.codePoint == VirtualCodePoint.LINE_END) break

      /**
       * The setext heading underline can be indented up to three spaces,
       * and may have trailing spaces
       * @see https://github.github.com/gfm/#example-56
       */
      if (isUnicodeWhitespaceCharacter(c.codePoint)) {
        hasPotentialInternalSpace = true
        continue
      }

      /**
       * The setext heading underline cannot contain internal spaces
       * @see https://github.github.com/gfm/#example-58
       *
       * A setext heading underline is a sequence of '=' characters or
       * a sequence of '-' characters
       * @see https://github.github.com/gfm/#setext-heading-underline
       */
      if (
        hasPotentialInternalSpace ||
        (c.codePoint !== AsciiCodePoint.EQUALS_SIGN && c.codePoint !== AsciiCodePoint.MINUS_SIGN) ||
        (marker != null && marker !== c.codePoint)
      ) {
        marker = null
        break
      }

      marker = c.codePoint
    }

    // Not a valid setext heading underline
    if (marker == null) return null

    const lines = api.extractPhrasingLines(prevSiblingToken)
    if (lines == null) return null

    const nextIndex = endIndex
    const token: IToken = {
      nodeType: HeadingType,
      position: {
        start: calcStartYastNodePoint(lines[0].nodePoints, lines[0].startIndex),
        end: calcEndYastNodePoint(nodePoints, nextIndex - 1),
      },
      marker,
      lines,
    }
    return {
      token,
      nextIndex,
      saturated: true,
      remainingSibling: null,
    }
  }
}
