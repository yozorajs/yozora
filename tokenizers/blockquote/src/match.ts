import type { BlockquoteCalloutType } from '@yozora/ast'
import { BlockquoteCalloutTypeEnum, BlockquoteType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import { AsciiCodePoint, VirtualCodePoint, isSpaceCharacter } from '@yozora/character'
import type {
  IBlockToken,
  IMatchBlockHookCreator,
  IPhrasingContentLine,
  IResultOfEatAndInterruptPreviousSibling,
  IResultOfEatContinuationText,
  IResultOfEatOpener,
} from '@yozora/core-tokenizer'
import { calcEndPoint, calcStartPoint } from '@yozora/core-tokenizer'
import type { IThis, IToken, T } from './types'

const calloutKeywords: ReadonlySet<string> = new Set(Object.values(BlockquoteCalloutTypeEnum))

/**
 * A block quote marker consists of 0-3 spaces of initial indent, plus
 *  (a) the character > together with a following space, or
 *  (b) a single character > not followed by a space.
 *
 * The following rules define block quotes:
 *  - Basic case. If a string of lines Ls constitute a sequence of blocks Bs,
 *    then the result of prepending a block quote marker to the beginning of
 *    each line in Ls is a block quote containing Bs.
 *
 *  - Laziness. If a string of lines Ls constitute a block quote with contents
 *    Bs, then the result of deleting the initial block quote marker from one
 *    or more lines in which the next non-whitespace character after the block
 *    quote marker is paragraph continuation text is a block quote with Bs as
 *    its content. Paragraph continuation text is text that will be parsed as
 *    part of the content of a paragraph, but does not occur at the beginning
 *    of the paragraph.
 *
 *  - Consecutiveness. A document cannot contain two block quotes in a row
 *    unless there is a blank line between them.
 *
 * @see https://github.com/syntax-tree/mdast#blockquote
 * @see https://github.github.com/gfm/#block-quotes
 * @see https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#alerts
 */
export const match: IMatchBlockHookCreator<T, IToken, IThis> = function () {
  const enableGithubCallout = this.enableGithubCallout

  return {
    isContainingBlock: true,
    eatOpener,
    eatAndInterruptPreviousSibling,
    eatContinuationText,
  }

  function eatOpener(line: Readonly<IPhrasingContentLine>): IResultOfEatOpener<T, IToken> {
    /**
     * The '>' characters can be indented 1-3 spaces
     * @see https://github.github.com/gfm/#example-209
     */
    if (line.countOfPrecedeSpaces >= 4) return null

    const { nodePoints, startIndex, endIndex, firstNonWhitespaceIndex } = line
    if (
      firstNonWhitespaceIndex >= endIndex ||
      nodePoints[firstNonWhitespaceIndex].codePoint !== AsciiCodePoint.CLOSE_ANGLE
    )
      return null

    /**
     * A block quote marker consists of 0-3 spaces of initial indent, plus
     *  (a) the character > together with a following space, or
     *  (b) a single character > not followed by a space.
     * @see https://github.github.com/gfm/#block-quote-marker
     */
    let nextIndex = firstNonWhitespaceIndex + 1
    if (nextIndex < endIndex && isSpaceCharacter(nodePoints[nextIndex].codePoint)) {
      nextIndex += 1
      /**
       * When the '>' followed by a tab, it is treated as if it were expanded
       * into three spaces.
       * @see https://github.github.com/gfm/#example-6
       */
      if (nextIndex < endIndex && nodePoints[nextIndex].codePoint === VirtualCodePoint.SPACE) {
        nextIndex += 1
      }
    }

    let callout: BlockquoteCalloutType | undefined
    if (enableGithubCallout) {
      const result = eatCalloutMarker(nodePoints, nextIndex, endIndex)
      if (result !== null) {
        callout = result.callout
        nextIndex = result.nextIndex
      }
    }

    const token: IToken = {
      nodeType: BlockquoteType,
      position: {
        start: calcStartPoint(nodePoints, startIndex),
        end: calcEndPoint(nodePoints, nextIndex - 1),
      },
      children: [],
      callout,
    }
    return { token, nextIndex }
  }

  function eatAndInterruptPreviousSibling(
    line: Readonly<IPhrasingContentLine>,
    prevSiblingToken: Readonly<IBlockToken>,
  ): IResultOfEatAndInterruptPreviousSibling<T, IToken> {
    const result = eatOpener(line)
    if (result == null) return null
    return {
      token: result.token,
      nextIndex: result.nextIndex,
      remainingSibling: prevSiblingToken,
      saturated: result.saturated,
    }
  }

  function eatContinuationText(
    line: Readonly<IPhrasingContentLine>,
    _token: IToken,
    parentToken: Readonly<IBlockToken>,
  ): IResultOfEatContinuationText {
    const { nodePoints, startIndex, endIndex, firstNonWhitespaceIndex, countOfPrecedeSpaces } = line

    if (
      countOfPrecedeSpaces >= 4 ||
      firstNonWhitespaceIndex >= endIndex ||
      nodePoints[firstNonWhitespaceIndex].codePoint !== AsciiCodePoint.CLOSE_ANGLE
    ) {
      /**
       * It is a consequence of the Laziness rule that any number of initial
       * `>`s may be omitted on a continuation line of a nested block quote
       * @see https://github.github.com/gfm/#example-229
       */
      if (parentToken.nodeType === BlockquoteType) {
        return { status: 'opening', nextIndex: startIndex }
      }
      return { status: 'notMatched' }
    }

    const nextIndex =
      firstNonWhitespaceIndex + 1 < endIndex &&
      isSpaceCharacter(nodePoints[firstNonWhitespaceIndex + 1].codePoint)
        ? firstNonWhitespaceIndex + 2
        : firstNonWhitespaceIndex + 1

    return { status: 'opening', nextIndex }
  }
}

interface ICalloutMarkerResult {
  callout: BlockquoteCalloutType
  nextIndex: number
}

function eatCalloutMarker(
  nodePoints: ReadonlyArray<INodePoint>,
  startIndex: number,
  endIndex: number,
): ICalloutMarkerResult | null {
  let i = startIndex

  // Skip leading spaces
  while (i < endIndex && isSpaceCharacter(nodePoints[i].codePoint)) {
    i += 1
  }

  // Check for `[!`
  if (
    i + 1 >= endIndex ||
    nodePoints[i].codePoint !== AsciiCodePoint.OPEN_BRACKET ||
    nodePoints[i + 1].codePoint !== AsciiCodePoint.EXCLAMATION_MARK
  ) {
    return null
  }
  i += 2

  // Read the keyword
  const keywordStart = i
  while (
    i < endIndex &&
    nodePoints[i].codePoint !== AsciiCodePoint.CLOSE_BRACKET &&
    !isSpaceCharacter(nodePoints[i].codePoint)
  ) {
    i += 1
  }

  if (i >= endIndex || nodePoints[i].codePoint !== AsciiCodePoint.CLOSE_BRACKET) {
    return null
  }

  const keyword = nodePoints
    .slice(keywordStart, i)
    .map(p => String.fromCodePoint(p.codePoint))
    .join('')
    .toLowerCase()

  if (!calloutKeywords.has(keyword)) {
    return null
  }

  i += 1 // Skip `]`

  // Skip trailing spaces and check for end of line or newline
  while (i < endIndex && isSpaceCharacter(nodePoints[i].codePoint)) {
    i += 1
  }

  // The callout marker should be on its own line (rest should be empty or newline)
  if (i < endIndex && nodePoints[i].codePoint !== VirtualCodePoint.LINE_END) {
    return null
  }

  return {
    callout: keyword as BlockquoteCalloutType,
    nextIndex: i < endIndex ? i + 1 : i,
  }
}
