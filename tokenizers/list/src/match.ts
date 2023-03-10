import { ListType, TaskStatus } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import {
  AsciiCodePoint,
  VirtualCodePoint,
  isAsciiDigitCharacter,
  isAsciiLowerLetter,
  isAsciiUpperLetter,
  isSpaceCharacter,
  isWhitespaceCharacter,
} from '@yozora/character'
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

/**
 * The following rules define list items:
 *  - Basic case. If a sequence of lines Ls constitute a sequence of blocks Bs
 *    starting with a non-whitespace character, and M is a list marker of width
 *    W followed by 1 ≤ N ≤ 4 spaces, then the result of prepending M and the
 *    following spaces to the first line of Ls, and indenting subsequent lines
 *    of Ls by W + N spaces, is a list item with Bs as its contents. The type
 *    of the list item (bullet or ordered) is determined by the type of its
 *    list marker. If the list item is ordered, then it is also assigned a
 *    start number, based on the ordered list marker.
 *
 *    Exceptions:
 *      - When the first list item in a list interrupts a paragraph—that is,
 *        when it starts on a line that would otherwise count as paragraph
 *        continuation text—then
 *        (a) the lines Ls must not begin with a blank line, and
 *        (b) if the list item is ordered, the start number must be 1.
 *      - If any line is a thematic break then that line is not a list item.
 *
 * @see https://github.com/syntax-tree/mdast#listitem
 * @see https://github.github.com/gfm/#list-items
 */

export const match: IMatchBlockHookCreator<T, IToken, IThis> = function () {
  const { emptyItemCouldNotInterruptedTypes, enableTaskListItem } = this

  return {
    isContainingBlock: true,
    eatOpener,
    eatAndInterruptPreviousSibling,
    eatContinuationText,
  }

  function eatOpener(line: Readonly<IPhrasingContentLine>): IResultOfEatOpener<T, IToken> {
    /**
     * Four spaces are too much.
     * @see https://github.github.com/gfm/#example-253
     */
    if (line.countOfPrecedeSpaces >= 4) return null

    const { nodePoints, startIndex, endIndex, firstNonWhitespaceIndex } = line
    if (firstNonWhitespaceIndex >= endIndex) return null

    let ordered = false
    let marker: number | null = null
    let orderType: '1' | 'a' | 'A' | 'i' | 'I' | undefined
    let order: number | undefined
    let i = firstNonWhitespaceIndex
    let c = nodePoints[i].codePoint

    /**
     * Try to resolve an ordered list-item.
     *
     * An ordered list marker is a sequence of 1–9 arabic digits (0-9),
     * followed by either a . character or a ) character. (The reason
     * for the length limit is that with 10 digits we start seeing integer
     * overflows in some browsers.)
     * @see https://github.github.com/gfm/#ordered-list-marker
     *
     * Extension: /[a-z]/ and /[A-Z]/ and [iv]+ also could be consisted the
     * marker of an ordered list.
     */
    if (i + 1 < endIndex) {
      // TODO Support roman numerals.
      const c0 = c
      if (isAsciiDigitCharacter(c0)) {
        orderType = '1'
        let v = c0 - AsciiCodePoint.DIGIT0
        for (i += 1; i < endIndex; ++i) {
          c = nodePoints[i].codePoint
          if (!isAsciiDigitCharacter(c)) break
          v = v * 10 + c - AsciiCodePoint.DIGIT0
        }
        order = v
        orderType = '1'
      } else if (isAsciiLowerLetter(c0)) {
        i += 1
        c = nodePoints[i].codePoint
        order = c0 - AsciiCodePoint.LOWERCASE_A + 1
        orderType = 'a'
      } else if (isAsciiUpperLetter(c0)) {
        i += 1
        c = nodePoints[i].codePoint
        order = c0 - AsciiCodePoint.UPPERCASE_A + 1
        orderType = 'A'
      }

      // eat '.' / ')'
      if (
        i > firstNonWhitespaceIndex &&
        i - firstNonWhitespaceIndex <= 9 &&
        (c === AsciiCodePoint.DOT || c === AsciiCodePoint.CLOSE_PARENTHESIS)
      ) {
        i += 1
        ordered = true
        marker = c
      }
    }

    /**
     * Try to resolve a bullet list-item.
     *
     * A bullet list marker is a -, +, or * character.
     * @see https://github.github.com/gfm/#bullet-list-marker
     */
    if (!ordered) {
      if (
        c === AsciiCodePoint.PLUS_SIGN ||
        c === AsciiCodePoint.MINUS_SIGN ||
        c === AsciiCodePoint.ASTERISK
      ) {
        i += 1
        marker = c
      }
    }

    if (marker == null) return null

    /**
     * When the list-item mark followed by a tab, it is treated as if it were
     * expanded into three spaces.
     *
     * @see https://github.github.com/gfm/#example-7
     */
    let countOfSpaces = 0,
      nextIndex = i
    if (nextIndex < endIndex) {
      c = nodePoints[nextIndex].codePoint
      if (c === VirtualCodePoint.SPACE) nextIndex += 1
    }

    /**
     * #Rule1 Basic case
     *
     * If a sequence of lines Ls constitute a sequence of blocks Bs starting
     * with a non-whitespace character, and M is a list marker of width W
     * followed by 1 ≤ N ≤ 4 spaces, then the result of prepending M and the
     * following spaces to the first line of Ls, and indenting subsequent
     * lines of Ls by W + N spaces, is a list item with Bs as its contents.
     * The type of the list item (bullet or ordered) is determined by the
     * type of its list marker. If the list item is ordered, then it is also
     * assigned a start number, based on the ordered list marker.
     * @see https://github.github.com/gfm/#list-items Basic case
     */
    for (; nextIndex < endIndex; ++nextIndex) {
      c = nodePoints[nextIndex].codePoint
      if (!isSpaceCharacter(c)) break
      countOfSpaces += 1
    }

    /**
     * Rule#2 Item starting with indented code.
     *
     * If a sequence of lines Ls constitute a sequence of blocks Bs starting
     * with an indented code block, and M is a list marker of width W followed
     * by one space, then the result of prepending M and the following space to
     * the first line of Ls, and indenting subsequent lines of Ls by W + 1 spaces,
     * is a list item with Bs as its contents. If a line is empty, then it need
     * not be indented. The type of the list item (bullet or ordered) is
     * determined by the type of its list marker. If the list item is ordered,
     * then it is also assigned a start number, based on the ordered list marker.
     * @see https://github.github.com/gfm/#list-items Item starting with indented code.
     */
    if (countOfSpaces > 4) {
      nextIndex -= countOfSpaces - 1
      countOfSpaces = 1
    }

    /**
     * Rule#3 Item starting with a blank line.
     *
     * If a sequence of lines Ls starting with a single blank line constitute
     * a (possibly empty) sequence of blocks Bs, not separated from each other
     * by more than one blank line, and M is a list marker of width W, then the
     * result of prepending M to the first line of Ls, and indenting subsequent
     * lines of Ls by W + 1 spaces, is a list item with Bs as its contents.
     * If a line is empty, then it need not be indented. The type of the list
     * item (bullet or ordered) is determined by the type of its list marker.
     * If the list item is ordered, then it is also assigned a start number,
     * based on the ordered list marker.
     * @see https://github.github.com/gfm/#list-items Item starting with a blank line
     */
    if (countOfSpaces === 0 && nextIndex < endIndex && c !== VirtualCodePoint.LINE_END) return null

    const countOfTopBlankLine = c === VirtualCodePoint.LINE_END ? 1 : -1
    if (c === VirtualCodePoint.LINE_END) {
      nextIndex -= countOfSpaces - 1
      countOfSpaces = 1
    }

    /**
     * Rule#4 Indentation.
     *
     * If a sequence of lines Ls constitutes a list item according to rule #1,
     * #2, or #3, then the result of indenting each line of Ls by 1-3 spaces
     * (the same for each line) also constitutes a list item with the same
     * contents and attributes. If a line is empty, then it need not be indented.
     */
    const indent = i - startIndex + countOfSpaces

    // Try to resolve task status.
    let status: TaskStatus | null = null
    if (enableTaskListItem) {
      ;({ status, nextIndex } = eatTaskStatus(nodePoints, nextIndex, endIndex))
    }

    const token: IToken = {
      nodeType: ListType,
      position: {
        start: calcStartPoint(nodePoints, startIndex),
        end: calcEndPoint(nodePoints, nextIndex - 1),
      },
      ordered,
      marker,
      orderType: ordered ? orderType : undefined,
      order: ordered ? order : undefined,
      indent,
      countOfTopBlankLine,
      children: [],
    }

    if (status != null) token.status = status
    return { token, nextIndex }
  }

  function eatAndInterruptPreviousSibling(
    line: Readonly<IPhrasingContentLine>,
    prevSiblingToken: Readonly<IBlockToken>,
  ): IResultOfEatAndInterruptPreviousSibling<T, IToken> {
    /**
     * ListItem can interrupt Paragraph
     * @see https://github.github.com/gfm/#list-items Basic case Exceptions 1
     */
    const result = eatOpener(line)
    if (result == null) return null
    const { token, nextIndex } = result

    /**
     * But an empty list item cannot interrupt a paragraph
     * @see https://github.github.com/gfm/#example-263
     */
    if (emptyItemCouldNotInterruptedTypes.includes(prevSiblingToken.nodeType)) {
      if (token.indent === line.endIndex - line.startIndex) {
        return null
      }

      /**
       * In order to solve of unwanted lists in paragraphs with hard-wrapped
       * numerals, we allow only lists starting with 1 to interrupt paragraphs
       * @see https://github.github.com/gfm/#example-284
       */
      if (token.ordered && token.order !== 1) return null
    }

    return { token, nextIndex, remainingSibling: prevSiblingToken }
  }

  function eatContinuationText(
    line: Readonly<IPhrasingContentLine>,
    token: IToken,
  ): IResultOfEatContinuationText {
    const { startIndex, endIndex, firstNonWhitespaceIndex, countOfPrecedeSpaces: indent } = line

    /**
     * A list item can begin with at most one blank line
     * @see https://github.github.com/gfm/#example-258
     */
    if (firstNonWhitespaceIndex < endIndex && indent < token.indent) {
      return { status: 'notMatched' }
    }

    /**
     * When encountering a blank line, it consumes at most indent characters
     * and cannot exceed the newline character
     * @see https://github.github.com/gfm/#example-242
     * @see https://github.github.com/gfm/#example-298
     */
    if (firstNonWhitespaceIndex >= endIndex) {
      if (token.countOfTopBlankLine >= 0) {
        // eslint-disable-next-line no-param-reassign
        token.countOfTopBlankLine += 1
        if (token.countOfTopBlankLine > 1) {
          return { status: 'notMatched' }
        }
      }
    } else {
      // eslint-disable-next-line no-param-reassign
      token.countOfTopBlankLine = -1
    }

    const nextIndex = Math.min(startIndex + token.indent, endIndex - 1)
    return { status: 'opening', nextIndex }
  }
}

/**
 * A task list item is a list item where the first block in it is a paragraph
 * which begins with a task list item marker and at least one whitespace
 * character before any other content.
 *
 * A task list item marker consists of an optional number of spaces, a left
 * bracket ([), either a whitespace character or the letter x in either
 * lowercase or uppercase, and then a right bracket (]).
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @see https://github.github.com/gfm/#task-list-item
 */
function eatTaskStatus(
  nodePoints: ReadonlyArray<INodePoint>,
  startIndex: number,
  endIndex: number,
): { status: TaskStatus | null; nextIndex: number } {
  let i = startIndex
  for (; i < endIndex; ++i) {
    const c = nodePoints[i].codePoint
    if (!isSpaceCharacter(c)) break
  }

  if (
    i + 3 >= endIndex ||
    nodePoints[i].codePoint !== AsciiCodePoint.OPEN_BRACKET ||
    nodePoints[i + 2].codePoint !== AsciiCodePoint.CLOSE_BRACKET ||
    !isWhitespaceCharacter(nodePoints[i + 3].codePoint)
  )
    return { status: null, nextIndex: startIndex }

  let status: TaskStatus | undefined
  const c = nodePoints[i + 1].codePoint
  switch (c) {
    case AsciiCodePoint.SPACE:
      status = TaskStatus.TODO
      break
    case AsciiCodePoint.MINUS_SIGN:
      status = TaskStatus.DOING
      break
    case AsciiCodePoint.LOWERCASE_X:
    case AsciiCodePoint.UPPERCASE_X:
      status = TaskStatus.DONE
      break
    default:
      return { status: null, nextIndex: startIndex }
  }
  return { status, nextIndex: i + 4 }
}
