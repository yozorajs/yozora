import { FootnoteType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import { AsciiCodePoint } from '@yozora/character'
import type {
  IInlineToken,
  IMatchInlineHookCreator,
  IResultOfIsDelimiterPair,
  IResultOfProcessDelimiterPair,
} from '@yozora/core-tokenizer'
import { genFindDelimiter } from '@yozora/core-tokenizer'
import { checkBalancedBracketsStatus } from '@yozora/tokenizer-link'
import type { IDelimiter, IThis, IToken, T } from './types'

/**
 * An inline footnote consists of a footnote text followed immediately by a right
 * square bracket ']'.
 *
 * Like the inline links, footnote could not be contained by other footnote.
 *
 * @see https://github.com/syntax-tree/mdast-util-footnote
 * @see https://github.com/remarkjs/remark-footnotes
 * @see https://github.com/syntax-tree/mdast#link
 * @see https://github.github.com/gfm/#links
 * @see https://www.markdownguide.org/extended-syntax/#footnotes
 */
export const match: IMatchInlineHookCreator<T, IDelimiter, IToken, IThis> = function (api) {
  return {
    findDelimiter: () => genFindDelimiter<IDelimiter>(_findDelimiter),
    isDelimiterPair,
    processDelimiterPair,
  }

  function _findDelimiter(startIndex: number, endIndex: number): IDelimiter | null {
    const nodePoints: readonly INodePoint[] = api.getNodePoints()

    for (let i = startIndex; i < endIndex; ++i) {
      const c = nodePoints[i].codePoint
      switch (c) {
        case AsciiCodePoint.BACKSLASH:
          i += 1
          break
        case AsciiCodePoint.CARET: {
          if (i + 1 < endIndex && nodePoints[i + 1].codePoint === AsciiCodePoint.OPEN_BRACKET) {
            return {
              type: 'opener',
              startIndex: i,
              endIndex: i + 2,
            }
          }
          break
        }
        case AsciiCodePoint.CLOSE_BRACKET:
          return {
            type: 'closer',
            startIndex: i,
            endIndex: i + 1,
          }
      }
    }
    return null
  }

  function isDelimiterPair(
    openerDelimiter: IDelimiter,
    closerDelimiter: IDelimiter,
    internalTokens: readonly IInlineToken[],
  ): IResultOfIsDelimiterPair {
    const nodePoints: readonly INodePoint[] = api.getNodePoints()

    if (containsFootnote(internalTokens, openerDelimiter.endIndex, closerDelimiter.startIndex)) {
      return { paired: false, opener: false, closer: false }
    }

    const balancedBracketsStatus: -1 | 0 | 1 = checkBalancedBracketsStatus(
      openerDelimiter.endIndex,
      closerDelimiter.startIndex,
      internalTokens,
      nodePoints,
    )
    switch (balancedBracketsStatus) {
      case -1:
        return { paired: false, opener: false, closer: true }
      case 0:
        return { paired: true }
      case 1:
        return { paired: false, opener: true, closer: false }
    }
  }

  function processDelimiterPair(
    openerDelimiter: IDelimiter,
    closerDelimiter: IDelimiter,
    internalTokens: readonly IInlineToken[],
  ): IResultOfProcessDelimiterPair<T, IToken, IDelimiter> {
    const token: IToken = {
      nodeType: FootnoteType,
      startIndex: openerDelimiter.startIndex,
      endIndex: closerDelimiter.endIndex,
      children: api.resolveInternalTokens(
        internalTokens,
        openerDelimiter.endIndex,
        closerDelimiter.startIndex,
      ),
    }
    return { tokens: [token] }
  }
}

function containsFootnote(
  tokens: readonly IInlineToken[],
  startIndex: number,
  endIndex: number,
): boolean {
  const stack: Array<{ tokens: readonly IInlineToken[]; index: number }> = [{ tokens, index: 0 }]

  while (stack.length > 0) {
    const frame = stack[stack.length - 1]
    if (frame.index >= frame.tokens.length) {
      stack.pop()
      continue
    }

    const token = frame.tokens[frame.index++]
    if (token.startIndex >= endIndex || token.endIndex <= startIndex) continue
    if (token.nodeType === FootnoteType) return true
    if (token.children?.length) stack.push({ tokens: token.children, index: 0 })
  }
  return false
}
