import { HtmlType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import { AsciiCodePoint, isAsciiUpperLetter } from '@yozora/character'
import type {
  IMatchInlineHookCreator,
  IResultOfProcessSingleDelimiter,
} from '@yozora/core-tokenizer'
import { eatOptionalWhitespaces, genFindDelimiter } from '@yozora/core-tokenizer'
import type { IDelimiter, IThis, IToken, T } from './types'
import { eatHtmlInlineCDataDelimiter } from './util/cdata'
import { eatHtmlInlineClosingDelimiter } from './util/closing'
import { eatHtmlInlineCommentDelimiter } from './util/comment'
import { eatHtmlInlineDeclarationDelimiter } from './util/declaration'
import { eatHtmlInlineInstructionDelimiter } from './util/instruction'
import { eatHtmlInlineTokenOpenDelimiter } from './util/open'

interface ICloserCache {
  cdata: number
  declaration: number
  endIndex: number
  instruction: number
}

/**
 * Text between '<' and '>' that looks like an HTML tag is parsed as a raw HTML
 * tag and will be rendered in HTML without escaping. Tag and attribute names
 * are not limited to current HTML tags, so custom tags (and even, say, DocBook
 * tags) may be used.
 *
 * @see https://github.github.com/gfm/#raw-html
 */
export const match: IMatchInlineHookCreator<T, IDelimiter, IToken, IThis> = function (api) {
  return {
    findDelimiter: () => {
      const closerCache: ICloserCache = {
        cdata: -1,
        declaration: -1,
        endIndex: -1,
        instruction: -1,
      }
      return genFindDelimiter<IDelimiter>((startIndex, endIndex) =>
        _findDelimiter(startIndex, endIndex, closerCache),
      )
    },
    processSingleDelimiter,
  }

  function _findDelimiter(
    startIndex: number,
    endIndex: number,
    closerCache: ICloserCache,
  ): IDelimiter | null {
    const nodePoints: readonly INodePoint[] = api.getNodePoints()

    for (let i = startIndex; i < endIndex; ++i) {
      i = eatOptionalWhitespaces(nodePoints, i, endIndex)
      if (i >= endIndex) break

      const c = nodePoints[i].codePoint
      switch (c) {
        case AsciiCodePoint.BACKSLASH:
          i += 1
          break
        case AsciiCodePoint.OPEN_ANGLE: {
          const delimiter: IDelimiter | null = tryToEatDelimiter(
            nodePoints,
            closerCache,
            i,
            endIndex,
          )
          if (delimiter != null) return delimiter
          break
        }
      }
    }
    return null
  }

  function processSingleDelimiter(
    delimiter: IDelimiter,
  ): IResultOfProcessSingleDelimiter<T, IToken> {
    const token: IToken = {
      ...delimiter,
      nodeType: HtmlType,
    }
    return [token]
  }
}

/**
 * Try to eat a delimiter
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 */
function tryToEatDelimiter(
  nodePoints: readonly INodePoint[],
  closerCache: ICloserCache,
  startIndex: number,
  endIndex: number,
): IDelimiter | null {
  let delimiter: IDelimiter | null

  // Try open tag.
  delimiter = eatHtmlInlineTokenOpenDelimiter(nodePoints, startIndex, endIndex)
  if (delimiter != null) return delimiter

  // Try closing tag.
  delimiter = eatHtmlInlineClosingDelimiter(nodePoints, startIndex, endIndex)
  if (delimiter != null) return delimiter

  // Try html comment.
  delimiter = eatHtmlInlineCommentDelimiter(nodePoints, startIndex, endIndex)
  if (delimiter != null) return delimiter

  // Try processing instruction.
  const secondCodePoint = nodePoints[startIndex + 1]?.codePoint
  if (
    secondCodePoint === AsciiCodePoint.QUESTION_MARK &&
    mayHaveCloser(closerCache, closerCache.instruction, startIndex + 2, endIndex)
  ) {
    delimiter = eatHtmlInlineInstructionDelimiter(nodePoints, startIndex, endIndex)
    if (delimiter != null) return delimiter
    updateCloserCache(nodePoints, closerCache, startIndex + 2, endIndex)
  }

  // Try declaration.
  const thirdCodePoint = nodePoints[startIndex + 2]?.codePoint
  if (
    secondCodePoint === AsciiCodePoint.EXCLAMATION_MARK &&
    isAsciiUpperLetter(thirdCodePoint) &&
    mayHaveCloser(closerCache, closerCache.declaration, startIndex + 3, endIndex)
  ) {
    delimiter = eatHtmlInlineDeclarationDelimiter(nodePoints, startIndex, endIndex)
    if (delimiter != null) return delimiter
    updateCloserCache(nodePoints, closerCache, startIndex + 3, endIndex)
  }

  // Try CDATA section.
  if (
    secondCodePoint === AsciiCodePoint.EXCLAMATION_MARK &&
    thirdCodePoint === AsciiCodePoint.OPEN_BRACKET &&
    mayHaveCloser(closerCache, closerCache.cdata, startIndex + 3, endIndex)
  ) {
    delimiter = eatHtmlInlineCDataDelimiter(nodePoints, startIndex, endIndex)
    if (delimiter != null) return delimiter
    updateCloserCache(nodePoints, closerCache, startIndex + 3, endIndex)
  }
  return null
}

function mayHaveCloser(
  cache: ICloserCache,
  closerStartIndex: number,
  startIndex: number,
  endIndex: number,
): boolean {
  return endIndex !== cache.endIndex || closerStartIndex >= startIndex
}

/**
 * Cache the last closer of each type after an eater fails.
 */
function updateCloserCache(
  nodePoints: readonly INodePoint[],
  cache: ICloserCache,
  startIndex: number,
  endIndex: number,
): void {
  if (endIndex === cache.endIndex) return

  cache.cdata = cache.declaration = cache.instruction = -1
  cache.endIndex = endIndex

  for (let i = endIndex - 1; i >= startIndex; --i) {
    if (nodePoints[i].codePoint !== AsciiCodePoint.CLOSE_ANGLE) continue

    if (cache.declaration < 0) cache.declaration = i
    if (cache.instruction < 0 && nodePoints[i - 1]?.codePoint === AsciiCodePoint.QUESTION_MARK) {
      cache.instruction = i - 1
    }
    if (
      cache.cdata < 0 &&
      nodePoints[i - 1]?.codePoint === AsciiCodePoint.CLOSE_BRACKET &&
      nodePoints[i - 2]?.codePoint === AsciiCodePoint.CLOSE_BRACKET
    ) {
      cache.cdata = i - 2
    }
    if (cache.cdata >= 0 && cache.instruction >= 0) break
  }
}
