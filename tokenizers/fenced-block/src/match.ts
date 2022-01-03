import type { YastNodeType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import { calcTrimBoundaryOfCodePoints, isSpaceCharacter } from '@yozora/character'
import type {
  IMatchBlockHook,
  IMatchBlockPhaseApi,
  IPhrasingContentLine,
  IResultOfEatAndInterruptPreviousSibling,
  IResultOfEatContinuationText,
  IResultOfEatOpener,
  IYastBlockToken,
} from '@yozora/core-tokenizer'
import {
  calcEndYastNodePoint,
  calcStartYastNodePoint,
  eatOptionalCharacters,
} from '@yozora/core-tokenizer'
import type { IFencedBlockHookContext, IToken } from './types'

export function match<
  T extends YastNodeType = YastNodeType,
  IThis extends IFencedBlockHookContext<T> = IFencedBlockHookContext<T>,
>(this: IThis, _api: IMatchBlockPhaseApi): IMatchBlockHook<T, IToken<T>> {
  const { nodeType, markers, markersRequired, checkInfoString } = this
  return {
    isContainingBlock: false,
    eatOpener,
    eatAndInterruptPreviousSibling,
    eatContinuationText,
  }

  function eatOpener(line: Readonly<IPhrasingContentLine>): IResultOfEatOpener<T, IToken<T>> {
    /**
     * Four spaces indentation produces an indented code block
     * @see https://github.github.com/gfm/#example-104
     */
    if (line.countOfPrecedeSpaces >= 4) return null

    const { endIndex, firstNonWhitespaceIndex } = line
    if (firstNonWhitespaceIndex + markersRequired - 1 >= endIndex) return null

    const { nodePoints, startIndex } = line
    const marker: number = nodePoints[firstNonWhitespaceIndex].codePoint
    if (markers.indexOf(marker) < 0) return null

    const i = eatOptionalCharacters(nodePoints, firstNonWhitespaceIndex + 1, endIndex, marker)
    const countOfMark = i - firstNonWhitespaceIndex

    /**
     * The number of marker is not enough.
     * @see https://github.github.com/gfm/#example-91
     */
    if (countOfMark < markersRequired) return null

    /**
     * Eating Information string
     * The line with the opening block fence may optionally contain some text
     * following the block fence; this is trimmed of leading and trailing
     * whitespace and called the info string. If the info string comes after
     * a backtick fence, it may not contain any backtick characters. (The
     * reason for this restriction is that otherwise some inline code would
     * be incorrectly interpreted as the beginning of a fenced code block.)
     * @see https://github.github.com/gfm/#info-string
     */
    const [iLft, iRht] = calcTrimBoundaryOfCodePoints(nodePoints, i, endIndex)
    const infoString: INodePoint[] = nodePoints.slice(iLft, iRht)

    /**
     * Check if info string is valid, such as info strings for backtick code
     * blocks cannot contain backticks.
     * @see https://github.github.com/gfm/#example-115
     * @see https://github.github.com/gfm/#example-116
     */
    if (checkInfoString != null && !checkInfoString(infoString, marker, countOfMark)) {
      return null
    }

    const nextIndex = endIndex
    const token: IToken<T> = {
      nodeType: nodeType as T,
      position: {
        start: calcStartYastNodePoint(nodePoints, startIndex),
        end: calcEndYastNodePoint(nodePoints, nextIndex - 1),
      },
      indent: firstNonWhitespaceIndex - startIndex,
      marker: marker!,
      markerCount: countOfMark,
      lines: [],
      infoString,
    }
    return { token, nextIndex }
  }

  function eatAndInterruptPreviousSibling(
    line: Readonly<IPhrasingContentLine>,
    prevSiblingToken: Readonly<IYastBlockToken>,
  ): IResultOfEatAndInterruptPreviousSibling<T, IToken<T>> {
    const result = eatOpener(line)
    if (result == null) return null
    return {
      token: result.token,
      nextIndex: result.nextIndex,
      remainingSibling: prevSiblingToken,
    }
  }

  function eatContinuationText(
    line: Readonly<IPhrasingContentLine>,
    token: IToken<T>,
  ): IResultOfEatContinuationText {
    const { nodePoints, startIndex, endIndex, firstNonWhitespaceIndex, countOfPrecedeSpaces } = line

    /**
     * Check closing block fence
     *
     * The closing block fence may be indented up to three spaces, and may be
     * followed only by spaces, which are ignored. If the end of the containing
     * block (or document) is reached and no closing block fence has been found,
     * the code block contains all of the lines after the opening block fence
     * until the end of the containing block (or document). (An alternative spec
     * would require backtracking in the event that a closing block fence is not
     * found. But this makes parsing much less efficient, and there seems to be
     * no real down side to the behavior described here.)
     * @see https://github.github.com/gfm/#code-fence
     *
     * Closing fence indented with at most 3 spaces
     * @see https://github.github.com/gfm/#example-107
     */
    if (countOfPrecedeSpaces < 4 && firstNonWhitespaceIndex < endIndex) {
      let i = eatOptionalCharacters(nodePoints, firstNonWhitespaceIndex, endIndex, token.marker)
      const markerCount = i - firstNonWhitespaceIndex

      /**
       * The closing block fence must be at least as long as the opening fence
       * @see https://github.github.com/gfm/#example-94
       */
      if (markerCount >= token.markerCount) {
        // The closing block fence may be followed only by spaces.
        for (; i < endIndex; ++i) {
          const c = nodePoints[i].codePoint
          if (!isSpaceCharacter(c)) break
        }

        if (i + 1 >= endIndex) {
          return { status: 'closing', nextIndex: endIndex }
        }
      }
    }

    /**
     * Eating code content
     *
     * The content of the code block consists of all subsequent lines, until a
     * closing block fence of the same type as the code block began with
     * (backticks or tildes), and with at least as many backticks or tildes as
     * the opening block fence. If the leading block fence is indented N spaces,
     * then up to N spaces of indentation are removed from each line of the
     * content (if present).
     *
     * If a content line is not indented, it is preserved unchanged. If it is
     * indented less than N spaces, all of the indentation is removed, but the
     * line feed should be preserve.
     */
    const firstIndex = Math.min(startIndex + token.indent, firstNonWhitespaceIndex, endIndex - 1)
    token.lines.push({
      nodePoints,
      startIndex: firstIndex,
      endIndex,
      firstNonWhitespaceIndex,
      countOfPrecedeSpaces,
    })
    return { status: 'opening', nextIndex: endIndex }
  }
}
