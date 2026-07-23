import { LinkType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import { AsciiCodePoint, isWhitespaceCharacter } from '@yozora/character'
import type {
  IMatchInlineHookCreator,
  IResultOfProcessSingleDelimiter,
  IResultOfRequiredEater,
} from '@yozora/core-tokenizer'
import { genFindDelimiter } from '@yozora/core-tokenizer'
import type { AutolinkExtensionContentType, IDelimiter, IThis, IToken, T } from './types'
import { eatExtendEmailAddressFromLocalPartEnd, eatExtendEmailLocalPart } from './util/email'
import { eatDomainSegment, eatExtendedUrl, eatWWWDomain } from './util/uri'

const isW = (codePoint: number): boolean =>
  codePoint === AsciiCodePoint.LOWERCASE_W || codePoint === AsciiCodePoint.UPPERCASE_W

const hasWWWPrefix = (
  nodePoints: readonly INodePoint[],
  startIndex: number,
  endIndex: number,
): boolean =>
  startIndex + 3 < endIndex &&
  isW(nodePoints[startIndex].codePoint) &&
  isW(nodePoints[startIndex + 1].codePoint) &&
  isW(nodePoints[startIndex + 2].codePoint) &&
  nodePoints[startIndex + 3].codePoint === AsciiCodePoint.DOT

/**
 * @see https://github.github.com/gfm/#autolinks-extension-
 */
export const match: IMatchInlineHookCreator<T, IDelimiter, IToken, IThis> = function (api) {
  return {
    findDelimiter: () => genFindDelimiter<IDelimiter>(_findDelimiter),
    processSingleDelimiter,
  }

  function _findDelimiter(startIndex: number, endIndex: number): IDelimiter | null {
    const nodePoints: readonly INodePoint[] = api.getNodePoints()
    const blockStartIndex: number = api.getBlockStartIndex()
    let emailCheckedUntil = startIndex
    let wwwCheckedUntil = startIndex

    const eatEmailCandidate = (candidateStartIndex: number): IResultOfRequiredEater => {
      if (candidateStartIndex < emailCheckedUntil) {
        return { valid: false, nextIndex: emailCheckedUntil }
      }

      const localPartEndIndex = eatExtendEmailLocalPart(nodePoints, candidateStartIndex, endIndex)
      // Starts inside the same local-part run reach the same first '@' or
      // invalid character, so they cannot change a rejection into a match.
      emailCheckedUntil = localPartEndIndex
      const result = eatExtendEmailAddressFromLocalPartEnd(
        nodePoints,
        candidateStartIndex,
        localPartEndIndex,
        endIndex,
      )
      // Keep the boundary character available to the outer scanner.
      return result.valid ? result : { valid: false, nextIndex: localPartEndIndex }
    }

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
        // `_` is both an autolink boundary and a valid email local-part character.
        let emailStartIndex = -1
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
            if (c === AsciiCodePoint.UNDERSCORE) {
              if (emailStartIndex < 0) emailStartIndex = j
            } else {
              emailStartIndex = -1
            }
            continue
          }

          if (flag || j === blockStartIndex) break
          flag = false
        }

        if (j >= endIndex) break

        if (emailStartIndex >= 0) {
          const emailResult = eatEmailCandidate(emailStartIndex)
          if (emailResult.valid) {
            return {
              type: 'full',
              startIndex: emailStartIndex,
              endIndex: emailResult.nextIndex,
              contentType: 'email',
            }
          }
        }
        i = j
      }

      const urlResult = eatExtendedUrl(nodePoints, i, endIndex)
      let nextIndex: number = Math.min(endIndex, urlResult.nextIndex)
      let contentType: AutolinkExtensionContentType | null = urlResult.valid ? 'uri' : null
      if (urlResult.valid) nextIndex = urlResult.nextIndex

      const hasWWW = hasWWWPrefix(nodePoints, i, endIndex)
      if (contentType == null && hasWWW) {
        if (i < wwwCheckedUntil) {
          nextIndex = Math.min(nextIndex, wwwCheckedUntil)
        } else {
          const eatResult = eatWWWDomain(nodePoints, i, endIndex)
          nextIndex = Math.min(nextIndex, eatResult.nextIndex)
          if (eatResult.valid) {
            contentType = 'uri-www'
            nextIndex = eatResult.nextIndex
          } else {
            // A later `www.` in the same domain run has the same final segments,
            // so it cannot change this rejection into a match.
            wwwCheckedUntil = eatResult.nextIndex
          }
        }
      }

      if (contentType == null) {
        const eatResult = eatEmailCandidate(i)
        nextIndex = Math.min(nextIndex, eatResult.nextIndex)
        if (eatResult.valid) {
          contentType = 'email'
          nextIndex = eatResult.nextIndex
        }
      }

      // Optimization: move forward to the next latest potential position.
      if (contentType == null) {
        if (!hasWWW) {
          // Preserve the domain-segment boundary that eatWWWDomain used to
          // contribute, without scanning beyond the current skip window.
          const segment = eatDomainSegment(nodePoints, i, nextIndex)
          nextIndex = Math.min(nextIndex, segment.nextIndex)
        }
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
