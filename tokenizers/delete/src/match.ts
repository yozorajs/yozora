import { DeleteType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import { AsciiCodePoint, isWhitespaceCharacter } from '@yozora/character'
import type {
  IMatchInlineHookCreator,
  IResultOfProcessDelimiterPair,
  IYastInlineToken,
} from '@yozora/core-tokenizer'
import { eatOptionalCharacters, genFindDelimiter } from '@yozora/core-tokenizer'
import type { IDelimiter, IHookContext, IToken, T } from './types'

/**
 * Strikethrough text is any text wrapped in two tildes (~).
 *
 * @see https://github.com/syntax-tree/mdast#delete
 * @see https://github.github.com/gfm/#strikethrough-extension-
 */
export const match: IMatchInlineHookCreator<T, IDelimiter, IToken, IHookContext> = function (api) {
  return {
    findDelimiter: () => genFindDelimiter<IDelimiter>(_findDelimiter),
    processDelimiterPair,
  }

  function _findDelimiter(startIndex: number, endIndex: number): IDelimiter | null {
    const nodePoints: ReadonlyArray<INodePoint> = api.getNodePoints()
    for (let i = startIndex; i < endIndex; ++i) {
      const c = nodePoints[i].codePoint
      switch (c) {
        // Escape backslash
        case AsciiCodePoint.BACKSLASH:
          i += 1
          break
        /**
         * Strike through text is any text wrapped in two tildes '~'
         * @see https://github.github.com/gfm/#strikethrough-extension-
         */
        case AsciiCodePoint.TILDE: {
          const _startIndex = i
          i = eatOptionalCharacters(nodePoints, i + 1, endIndex, c) - 1
          if (i - _startIndex !== 1) break

          let delimiterType: IDelimiter['type'] = 'both'

          /**
           * If the preceding character is a whitespace, it cannot be used as a
           * closer delimiter
           */
          const preceding = _startIndex === startIndex ? null : nodePoints[_startIndex - 1]
          if (preceding != null && isWhitespaceCharacter(preceding.codePoint)) {
            delimiterType = 'opener'
          }

          /**
           * If the following character is a whitespace, it cannot be used as a
           * opener delimiter
           */
          const following = i + 1 === endIndex ? null : nodePoints[i + 1]
          if (following != null && isWhitespaceCharacter(following.codePoint)) {
            /**
             * If it can neither be used as a opener or closer delimiter, it
             * is not a valid delimiter
             */
            if (delimiterType !== 'both') break
            delimiterType = 'closer'
          }

          return {
            type: delimiterType,
            startIndex: _startIndex,
            endIndex: i + 1,
          }
        }
      }
    }
    return null
  }

  function processDelimiterPair(
    openerDelimiter: IDelimiter,
    closerDelimiter: IDelimiter,
    internalTokens: ReadonlyArray<IYastInlineToken>,
  ): IResultOfProcessDelimiterPair<T, IToken, IDelimiter> {
    // eslint-disable-next-line no-param-reassign
    internalTokens = api.resolveInternalTokens(
      internalTokens,
      openerDelimiter.endIndex,
      closerDelimiter.startIndex,
    )

    const token: IToken = {
      nodeType: DeleteType,
      startIndex: openerDelimiter.startIndex,
      endIndex: closerDelimiter.endIndex,
      children: internalTokens,
    }
    return { tokens: [token] }
  }
}
