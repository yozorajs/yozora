import { LinkType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import { AsciiCodePoint, isWhitespaceCharacter } from '@yozora/character'
import type {
  IMatchInlineHookCreator,
  IResultOfProcessSingleDelimiter,
} from '@yozora/core-tokenizer'
import { genFindDelimiter } from '@yozora/core-tokenizer'
import type {
  AutolinkExtensionContentType,
  ContentHelper,
  IDelimiter,
  IHookContext,
  IToken,
  T,
} from './types'
import { eatExtendEmailAddress } from './util/email'
import { eatExtendedUrl, eatWWWDomain } from './util/uri'

const helpers: ReadonlyArray<ContentHelper> = [
  { contentType: 'uri', eat: eatExtendedUrl },
  { contentType: 'uri-www', eat: eatWWWDomain },
  { contentType: 'email', eat: eatExtendEmailAddress },
]

/**
 * @see https://github.github.com/gfm/#autolinks-extension-
 */
export const match: IMatchInlineHookCreator<T, IDelimiter, IToken, IHookContext> = function (api) {
  return {
    findDelimiter: () => genFindDelimiter<IDelimiter>(_findDelimiter),
    processSingleDelimiter,
  }

  function _findDelimiter(startIndex: number, endIndex: number): IDelimiter | null {
    const nodePoints: ReadonlyArray<INodePoint> = api.getNodePoints()
    const blockStartIndex: number = api.getBlockStartIndex()
    for (let i = startIndex; i < endIndex; ++i) {
      /**
       * Autolinks can also be constructed without requiring the use of '<' and
       * to '>' to delimit them, although they will be recognized under a
       * smaller set of circumstances. All such recognized autolinks can only
       * come at the beginning of a line, after whitespace, or any of the
       * delimiting characters '*', '_', '~', and '('.
       * @see https://github.github.com/gfm/#autolinks-extension-
       */
      {
        let j = i
        let flag = false
        for (; j < endIndex; ++j) {
          const c = nodePoints[j].codePoint
          if (
            isWhitespaceCharacter(c) ||
            c === AsciiCodePoint.ASTERISK ||
            c === AsciiCodePoint.UNDERSCORE ||
            c === AsciiCodePoint.TILDE ||
            c === AsciiCodePoint.OPEN_PARENTHESIS
          ) {
            flag = true
            continue
          }

          if (flag || j === blockStartIndex) break
          flag = false
        }

        if (j >= endIndex) break
        i = j
      }

      let nextIndex: number = endIndex
      let contentType: AutolinkExtensionContentType | null = null
      for (const helper of helpers) {
        const eatResult = helper.eat(nodePoints, i, endIndex)
        nextIndex = Math.min(nextIndex, eatResult.nextIndex)
        if (eatResult.valid) {
          contentType = helper.contentType
          nextIndex = eatResult.nextIndex
          break
        }
      }

      // Optimization: move forward to the next latest potential position.
      if (contentType == null) {
        i = Math.max(i, nextIndex - 1)
        continue
      }

      if (nextIndex <= endIndex) {
        return {
          type: 'full',
          startIndex: i,
          endIndex: nextIndex,
          contentType,
        }
      }
      i = nextIndex - 1
    }
    return null
  }

  function processSingleDelimiter(
    delimiter: IDelimiter,
  ): IResultOfProcessSingleDelimiter<T, IToken> {
    const token: IToken = {
      nodeType: LinkType,
      startIndex: delimiter.startIndex,
      endIndex: delimiter.endIndex,
      contentType: delimiter.contentType,
      children: api.resolveFallbackTokens([], delimiter.startIndex, delimiter.endIndex),
    }
    return [token]
  }
}
