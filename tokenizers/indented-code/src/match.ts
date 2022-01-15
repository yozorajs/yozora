import { CodeType } from '@yozora/ast'
import { AsciiCodePoint, VirtualCodePoint } from '@yozora/character'
import type {
  IMatchBlockHookCreator,
  IPhrasingContentLine,
  IResultOfEatContinuationText,
  IResultOfEatOpener,
} from '@yozora/core-tokenizer'
import { calcEndPoint, calcStartPoint } from '@yozora/core-tokenizer'
import type { IThis, IToken, T } from './types'

/**
 * An indented code block is composed of one or more indented chunks
 * separated by blank lines. An indented chunk is a sequence of non-blank
 * lines, each indented four or more spaces. The contents of the code block
 * are the literal contents of the lines, including trailing line endings,
 * minus four spaces of indentation.
 *
 * @see https://github.github.com/gfm/#indented-code-block
 */
export const match: IMatchBlockHookCreator<T, IToken, IThis> = function () {
  return {
    isContainingBlock: false,
    eatOpener,
    eatContinuationText,
  }

  function eatOpener(line: Readonly<IPhrasingContentLine>): IResultOfEatOpener<T, IToken> {
    if (line.countOfPrecedeSpaces < 4) return null
    const { nodePoints, startIndex, firstNonWhitespaceIndex, endIndex } = line

    let firstIndex = startIndex + 4

    /**
     * If there exists 1-3 spaces before a tab forms the indent, the remain
     * virtual spaces of the tab should not be a part of the contents.
     * @see https://github.github.com/gfm/#example-2
     */
    if (
      nodePoints[startIndex].codePoint === AsciiCodePoint.SPACE &&
      nodePoints[startIndex + 3].codePoint === VirtualCodePoint.SPACE
    ) {
      let i = startIndex + 1
      for (; i < firstNonWhitespaceIndex; ++i) {
        if (nodePoints[i].codePoint === VirtualCodePoint.SPACE) break
      }
      firstIndex = i + 4
    }

    const nextIndex = endIndex
    const token: IToken = {
      nodeType: CodeType,
      position: {
        start: calcStartPoint(nodePoints, startIndex),
        end: calcEndPoint(nodePoints, nextIndex - 1),
      },
      lines: [
        {
          nodePoints,
          startIndex: firstIndex,
          endIndex,
          firstNonWhitespaceIndex,
          countOfPrecedeSpaces: line.countOfPrecedeSpaces - (firstIndex - startIndex),
        },
      ],
    }
    return { token, nextIndex }
  }

  function eatContinuationText(
    line: Readonly<IPhrasingContentLine>,
    token: IToken,
  ): IResultOfEatContinuationText {
    const { nodePoints, startIndex, endIndex, firstNonWhitespaceIndex, countOfPrecedeSpaces } = line

    if (countOfPrecedeSpaces < 4 && firstNonWhitespaceIndex < endIndex)
      return { status: 'notMatched' }

    /**
     * Blank line is allowed
     * @see https://github.github.com/gfm/#example-81
     * @see https://github.github.com/gfm/#example-82
     */
    const firstIndex = Math.min(endIndex - 1, startIndex + 4)
    token.lines.push({
      nodePoints,
      startIndex: firstIndex,
      endIndex,
      firstNonWhitespaceIndex,
      countOfPrecedeSpaces: countOfPrecedeSpaces - (firstIndex - startIndex),
    })
    return { status: 'opening', nextIndex: endIndex }
  }
}
