import { InlineMathType } from '@yozora/ast'
import type { ICodePoint, INodePoint } from '@yozora/character'
import { AsciiCodePoint, isWhitespaceCharacter } from '@yozora/character'
import {
  type IMatchInlineHookCreator,
  type IResultOfIsDelimiterPair,
  type IResultOfProcessDelimiterPair,
  genFindDelimiter,
} from '@yozora/core-tokenizer'
import type { IDelimiter, IThis, IToken, T } from './types'

export const match: IMatchInlineHookCreator<T, IDelimiter, IToken, IThis> = function (api) {
  return {
    findDelimiter: () => genFindDelimiter<IDelimiter>(_findDelimiter),
    isDelimiterPair,
    processDelimiterPair,
  }

  function _findDelimiter(startIndex: number, endIndex: number): IDelimiter | null {
    const nodePoints: ReadonlyArray<INodePoint> = api.getNodePoints()
    const blockStartIndex: number = api.getBlockStartIndex()
    const blockEndIndex: number = api.getBlockEndIndex()

    for (let i = startIndex; i < endIndex; ++i) {
      const c = nodePoints[i].codePoint
      switch (c) {
        case AsciiCodePoint.BACKSLASH:
          /**
           * Note that unlink code spans, backslash escapes works in inline-math.
           * @see https://github.github.com/gfm/#example-348
           */
          i += 1
          break
        /**
         * the right flanking string pattern is: <DOLLAR_SIGN><BACKTICK STRING>.
         * eg: $`, $``
         *
         * A backtick string is a string of one or more backtick characters '`'
         * that is neither preceded nor followed by a backtick.
         * @see https://github.github.com/gfm/#backtick-string
         */
        case AsciiCodePoint.DOLLAR_SIGN: {
          const leftCodePoint: ICodePoint | null =
            i === blockStartIndex ? null : nodePoints[i - 1].codePoint
          const rightCodePoint: ICodePoint | null =
            i + 1 === blockEndIndex ? null : nodePoints[i + 1].codePoint

          const isPotentialOpener: boolean =
            (leftCodePoint === null || isWhitespaceCharacter(leftCodePoint)) &&
            (rightCodePoint === null ||
              (rightCodePoint !== AsciiCodePoint.DOLLAR_SIGN &&
                !isWhitespaceCharacter(rightCodePoint)))
          const isPotentialCloser: boolean =
            (leftCodePoint === null || !isWhitespaceCharacter(leftCodePoint)) &&
            (rightCodePoint === null || isWhitespaceCharacter(rightCodePoint))
          if (!isPotentialOpener && !isPotentialCloser) break

          const delimiterType: 'opener' | 'closer' | 'both' | 'full' = isPotentialOpener
            ? isPotentialCloser
              ? 'both'
              : 'opener'
            : 'closer'
          const delimiter: IDelimiter = {
            type: delimiterType,
            startIndex: i,
            endIndex: i + 1,
            thickness: 1,
          }
          return delimiter
        }
      }
    }
    return null
  }

  function isDelimiterPair(): IResultOfIsDelimiterPair {
    return { paired: true }
  }

  function processDelimiterPair(
    openerDelimiter: IDelimiter,
    closerDelimiter: IDelimiter,
  ): IResultOfProcessDelimiterPair<T, IToken, IDelimiter> {
    const token: IToken = {
      nodeType: InlineMathType,
      startIndex: openerDelimiter.startIndex,
      endIndex: closerDelimiter.endIndex,
      thickness: 1,
    }
    return { tokens: [token] }
  }
}
