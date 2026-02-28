import { InlineMathType } from '@yozora/ast'
import type { ICodePoint, INodePoint } from '@yozora/character'
import { AsciiCodePoint, isPunctuationCharacter, isWhitespaceCharacter } from '@yozora/character'
import {
  type IMatchInlineHookCreator,
  type IResultOfIsDelimiterPair,
  type IResultOfProcessDelimiterPair,
  eatOptionalCharacters,
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
    const nodePoints: readonly INodePoint[] = api.getNodePoints()
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
          const _startIndex = i
          const leftCodePoint: ICodePoint | null =
            i === blockStartIndex ? null : nodePoints[i - 1].codePoint

          // matched as many dollar sign as possible
          i = eatOptionalCharacters(nodePoints, i + 1, blockEndIndex, AsciiCodePoint.DOLLAR_SIGN)

          const rightCodePoint: ICodePoint | null =
            i === blockEndIndex ? null : nodePoints[i].codePoint

          const thickness: number = i - _startIndex
          const isPotentialOpener: boolean =
            thickness > 1 || checkIfPotentialOpener(leftCodePoint, rightCodePoint)
          const isPotentialCloser: boolean =
            thickness > 1 || checkIfPotentialCloser(leftCodePoint, rightCodePoint)
          if (!isPotentialOpener && !isPotentialCloser) break

          const delimiterType: 'opener' | 'closer' | 'both' = isPotentialOpener
            ? isPotentialCloser
              ? 'both'
              : 'opener'
            : 'closer'
          const delimiter: IDelimiter = {
            type: delimiterType,
            startIndex: _startIndex,
            endIndex: i,
            thickness,
          }
          return delimiter
        }
      }
    }
    return null
  }
}

function checkIfPotentialOpener(
  leftCodePoint: ICodePoint | null,
  rightCodePoint: ICodePoint | null,
): boolean {
  if (rightCodePoint === null) return false
  if (leftCodePoint === AsciiCodePoint.BACKTICK) return false
  if (leftCodePoint === null) return true

  return isWhitespaceCharacter(leftCodePoint) || isPunctuationCharacter(leftCodePoint)
}

function checkIfPotentialCloser(
  leftCodePoint: ICodePoint | null,
  rightCodePoint: ICodePoint | null,
): boolean {
  if (leftCodePoint === null) return false
  if (rightCodePoint === AsciiCodePoint.BACKTICK) return false
  if (rightCodePoint === null) return true

  return isWhitespaceCharacter(rightCodePoint) || isPunctuationCharacter(rightCodePoint)
}

function isDelimiterPair(
  openerDelimiter: IDelimiter,
  closerDelimiter: IDelimiter,
): IResultOfIsDelimiterPair {
  if (
    openerDelimiter.thickness === closerDelimiter.thickness &&
    (openerDelimiter.type === 'opener' || openerDelimiter.type === 'both') &&
    (closerDelimiter.type === 'closer' || closerDelimiter.type === 'both')
  ) {
    return { paired: true }
  }
  return { paired: false, opener: true, closer: true }
}

function processDelimiterPair(
  openerDelimiter: IDelimiter,
  closerDelimiter: IDelimiter,
): IResultOfProcessDelimiterPair<T, IToken, IDelimiter> {
  const token: IToken = {
    nodeType: InlineMathType,
    startIndex: openerDelimiter.startIndex,
    endIndex: closerDelimiter.endIndex,
    thickness: openerDelimiter.thickness,
  }
  return { tokens: [token] }
}
