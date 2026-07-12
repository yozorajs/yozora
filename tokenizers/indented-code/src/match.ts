import { CodeType } from '@yozora/ast'
import type {
  IMatchBlockHookCreator,
  IPhrasingContentLine,
  IResultOfEatContinuationText,
  IResultOfEatOpener,
} from '@yozora/core-tokenizer'
import { calcEndPoint, calcStartPoint, eatIndentation } from '@yozora/core-tokenizer'
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
    if (line.indentWidth < 4) return null
    const { nodePoints, startIndex, firstNonWhitespaceIndex, endIndex } = line

    const firstIndex = eatIndentation(nodePoints, startIndex, firstNonWhitespaceIndex, 4)
    if (firstIndex == null) return null
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
          indentWidth: Math.max(0, line.indentWidth - 4),
        },
      ],
    }
    return { token, nextIndex }
  }

  function eatContinuationText(
    line: Readonly<IPhrasingContentLine>,
    token: IToken,
  ): IResultOfEatContinuationText {
    const { nodePoints, startIndex, endIndex, firstNonWhitespaceIndex } = line

    if (line.indentWidth < 4 && firstNonWhitespaceIndex < endIndex) return { status: 'notMatched' }

    /**
     * Blank line is allowed
     * @see https://github.github.com/gfm/#example-81
     * @see https://github.github.com/gfm/#example-82
     */
    const firstIndex =
      firstNonWhitespaceIndex < endIndex
        ? eatIndentation(nodePoints, startIndex, firstNonWhitespaceIndex, 4)
        : Math.min(endIndex - 1, startIndex + 4)
    if (firstIndex == null) return { status: 'notMatched' }
    token.lines.push({
      nodePoints,
      startIndex: firstIndex,
      endIndex,
      firstNonWhitespaceIndex,
      indentWidth: Math.max(0, line.indentWidth - 4),
    })
    return { status: 'opening', nextIndex: endIndex }
  }
}
