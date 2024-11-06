import { InlineMathType } from '@yozora/ast'
import type { INodeInterval, INodePoint } from '@yozora/character'
import { AsciiCodePoint } from '@yozora/character'
import type {
  IMatchInlineHookCreator,
  IResultOfFindDelimiters,
  IResultOfProcessSingleDelimiter,
  ITokenDelimiter,
} from '@yozora/core-tokenizer'
import { eatOptionalCharacters } from '@yozora/core-tokenizer'
import type { IDelimiter, IThis, IToken, T } from './types'

export const matchWithBacktick: IMatchInlineHookCreator<T, IDelimiter, IToken, IThis> = function (
  api,
) {
  return { findDelimiter, processSingleDelimiter }

  function* findDelimiter(): IResultOfFindDelimiters<IDelimiter> {
    const nodePoints: ReadonlyArray<INodePoint> = api.getNodePoints()
    const blockStartIndex: number = api.getBlockStartIndex()
    const blockEndIndex: number = api.getBlockEndIndex()

    const potentialDelimiters: ITokenDelimiter[] = []
    for (let i = blockStartIndex; i < blockEndIndex; ++i) {
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
         * A backtick string is a string of one or more backtick characters '`'
         * that is neither preceded nor followed by a backtick.
         * A code span begins with a backtick string and ends with a
         * backtick string of equal length.
         * @see https://github.github.com/gfm/#backtick-string
         * @see https://github.github.com/gfm/#code-span
         *
         * the left flanking string pattern is: <BACKTICK STRING><DOLLAR_SIGN>.
         * eg: `$, ``$
         *
         * A backtick string is a string of one or more backtick
         * characters '`' that is neither preceded nor followed by a backtick.
         * @see https://github.github.com/gfm/#backtick-string
         */
        case AsciiCodePoint.BACKTICK: {
          const _startIndex = i

          // matched as many backtick as possible
          i = eatOptionalCharacters(nodePoints, i + 1, blockEndIndex, AsciiCodePoint.BACKTICK)

          // No dollar character found after backtick string
          if (i >= blockEndIndex || nodePoints[i].codePoint !== AsciiCodePoint.DOLLAR_SIGN) {
            break
          }

          const delimiter: ITokenDelimiter = {
            type: 'opener',
            startIndex: _startIndex,
            endIndex: i + 1,
          }
          potentialDelimiters.push(delimiter)
          break
        }
        /**
         * the right flanking string pattern is: <DOLLAR_SIGN><BACKTICK STRING>.
         * eg: $`, $``
         *
         * A backtick string is a string of one or more backtick characters '`'
         * that is neither preceded nor followed by a backtick.
         * @see https://github.github.com/gfm/#backtick-string
         */
        case AsciiCodePoint.DOLLAR_SIGN: {
          // matched as many backtick as possible
          const _startIndex = i
          i = eatOptionalCharacters(nodePoints, i + 1, blockEndIndex, AsciiCodePoint.BACKTICK)

          // A dollar sign followed by a dollar sign is not part of a valid
          // inlineMath delimiter
          if (i < blockEndIndex && nodePoints[i].codePoint === AsciiCodePoint.DOLLAR_SIGN) {
            break
          }

          const thickness: number = i - _startIndex

          // No backtick character found after dollar
          if (thickness <= 1) break

          const delimiter: ITokenDelimiter = {
            type: 'closer',
            startIndex: _startIndex,
            endIndex: i,
          }
          potentialDelimiters.push(delimiter)
          i -= 1
          break
        }
      }
    }

    let pIndex = 0
    let lastEndIndex = -1
    let delimiter: IDelimiter | null = null
    while (pIndex < potentialDelimiters.length) {
      const [startIndex, endIndex] = yield delimiter

      // Read from cache.
      if (lastEndIndex === endIndex) {
        if (delimiter == null || delimiter.startIndex >= startIndex) continue
      }
      lastEndIndex = endIndex

      let openerDelimiter: INodeInterval | null = null
      let closerDelimiter: INodeInterval | null = null
      for (; pIndex < potentialDelimiters.length; ++pIndex) {
        for (; pIndex < potentialDelimiters.length; ++pIndex) {
          const delimiter = potentialDelimiters[pIndex]
          if (delimiter.startIndex >= startIndex && delimiter.type !== 'closer') break
        }
        if (pIndex + 1 >= potentialDelimiters.length) break

        openerDelimiter = potentialDelimiters[pIndex]
        const thickness = openerDelimiter.endIndex - openerDelimiter.startIndex
        for (let i = pIndex + 1; i < potentialDelimiters.length; ++i) {
          const delimiter = potentialDelimiters[i]
          if (
            delimiter.type !== 'opener' &&
            delimiter.endIndex - delimiter.startIndex === thickness
          ) {
            closerDelimiter = delimiter
            break
          }
        }

        // No matched inlineCode closer marker found, try next one.
        if (closerDelimiter != null) break
      }

      if (closerDelimiter == null) return

      delimiter = {
        type: 'full',
        startIndex: openerDelimiter!.startIndex,
        endIndex: closerDelimiter.endIndex,
        thickness: closerDelimiter.endIndex - closerDelimiter.startIndex,
      }
    }
  }

  function processSingleDelimiter(
    delimiter: IDelimiter,
  ): IResultOfProcessSingleDelimiter<T, IToken> {
    const token: IToken = {
      nodeType: InlineMathType,
      startIndex: delimiter.startIndex,
      endIndex: delimiter.endIndex,
      thickness: delimiter.thickness,
    }
    return [token]
  }
}
