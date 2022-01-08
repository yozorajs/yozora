import { ImageType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import { AsciiCodePoint } from '@yozora/character'
import type {
  IMatchInlineHookCreator,
  IResultOfIsDelimiterPair,
  IResultOfProcessDelimiterPair,
  IYastInlineToken,
} from '@yozora/core-tokenizer'
import { eatOptionalWhitespaces, genFindDelimiter } from '@yozora/core-tokenizer'
import {
  checkBalancedBracketsStatus,
  eatLinkDestination,
  eatLinkTitle,
} from '@yozora/tokenizer-link'
import type { IDelimiter, IHookContext, IToken, T } from './types'

/**
 * Syntax for images is like the syntax for links, with one difference.
 * Instead of link text, we have an image description.
 * The rules for this are the same as for link text, except that
 *
 *  a) an image description starts with '![' rather than '[', and
 *  b) an image description may contain links.
 *
 * An image description has inline elements as its contents. When an image is
 * rendered to HTML, this is standardly used as the image’s alt attribute.
 *
 * ------
 *
 * A 'opener' type delimiter is one of the following forms:
 *
 *  - '!['
 *
 * A 'closer' type delimiter is one of the following forms:
 *
 *  - '](url)'
 *  - '](url "title")'
 *  - '](<url>)'
 *  - '](<url> "title")'
 *
 * @see https://github.com/syntax-tree/mdast#image
 * @see https://github.github.com/gfm/#images
 */
export const match: IMatchInlineHookCreator<T, IDelimiter, IToken, IHookContext> = function (api) {
  return {
    findDelimiter: () => genFindDelimiter<IDelimiter>(_findDelimiter),
    isDelimiterPair,
    processDelimiterPair,
  }
  /**
   * Images can contains Images, so implement an algorithm similar to bracket
   * matching, pushing all opener delimiters onto the stack
   *
   * The rules for this are the same as for link text, except that
   *  (a) an image description starts with '![' rather than '[', and
   *  (b) an image description may contain links. An image description has
   *      inline elements as its contents. When an image is rendered to HTML,
   *      this is standardly used as the image’s alt attribute
   *
   * @see https://github.github.com/gfm/#inline-link
   * @see https://github.github.com/gfm/#example-582
   *
   * @override
   * @see IMatchInlineHook
   */
  function _findDelimiter(startIndex: number, endIndex: number): IDelimiter | null {
    const nodePoints: ReadonlyArray<INodePoint> = api.getNodePoints()
    const blockEndIndex = api.getBlockEndIndex()

    /**
     * FIXME:
     *
     * This is a hack method to fix the situation where a higher priority token
     * is embedded in the delimiter, at this time, ignore the tokens that have
     * been parsed, and continue to match the content until the delimiter meets
     * its own definition or reaches the right boundary of the block content.
     *
     * This algorithm has not been strictly logically verified, but I think it
     * can work well in most cases. After all, it has passed many test cases.
     * @see https://github.github.com/gfm/#example-588
     */
    for (let i = startIndex; i < endIndex; ++i) {
      const c = nodePoints[i].codePoint
      switch (c) {
        case AsciiCodePoint.BACKSLASH:
          i += 1
          break
        case AsciiCodePoint.EXCLAMATION_MARK: {
          if (i + 1 < endIndex && nodePoints[i + 1].codePoint === AsciiCodePoint.OPEN_BRACKET) {
            return {
              type: 'opener',
              startIndex: i,
              endIndex: i + 2,
            }
          }
          break
        }
        /**
         * An inline link consists of a link text followed immediately by a
         * left parenthesis '(', ..., and a right parenthesis ')'
         * @see https://github.github.com/gfm/#inline-link
         */
        case AsciiCodePoint.CLOSE_BRACKET: {
          /**
           * An inline link consists of a link text followed immediately by a
           * left parenthesis '('
           * @see https://github.github.com/gfm/#inline-link
           */
          if (
            i + 1 >= endIndex ||
            nodePoints[i + 1].codePoint !== AsciiCodePoint.OPEN_PARENTHESIS
          ) {
            break
          }

          // try to match link destination
          const destinationStartIndex = eatOptionalWhitespaces(nodePoints, i + 2, blockEndIndex)
          const destinationEndIndex = eatLinkDestination(
            nodePoints,
            destinationStartIndex,
            blockEndIndex,
          )
          if (destinationEndIndex < 0) break

          // try to match link title
          const titleStartIndex = eatOptionalWhitespaces(
            nodePoints,
            destinationEndIndex,
            blockEndIndex,
          )
          const titleEndIndex = eatLinkTitle(nodePoints, titleStartIndex, blockEndIndex)
          if (titleEndIndex < 0) break

          const _startIndex = i
          const _endIndex = eatOptionalWhitespaces(nodePoints, titleEndIndex, blockEndIndex) + 1
          if (
            _endIndex > blockEndIndex ||
            nodePoints[_endIndex - 1].codePoint !== AsciiCodePoint.CLOSE_PARENTHESIS
          ) {
            break
          }

          /**
           * Both the title and the destination may be omitted
           * @see https://github.github.com/gfm/#example-495
           */
          return {
            type: 'closer',
            startIndex: _startIndex,
            endIndex: _endIndex,
            destinationContent:
              destinationStartIndex < destinationEndIndex
                ? {
                    startIndex: destinationStartIndex,
                    endIndex: destinationEndIndex,
                  }
                : undefined,
            titleContent:
              titleStartIndex < titleEndIndex
                ? { startIndex: titleStartIndex, endIndex: titleEndIndex }
                : undefined,
          }
        }
      }
    }
    return null
  }

  function isDelimiterPair(
    openerDelimiter: IDelimiter,
    closerDelimiter: IDelimiter,
    internalTokens: ReadonlyArray<IYastInlineToken>,
  ): IResultOfIsDelimiterPair {
    const nodePoints: ReadonlyArray<INodePoint> = api.getNodePoints()
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
    internalTokens: ReadonlyArray<IYastInlineToken>,
  ): IResultOfProcessDelimiterPair<T, IToken, IDelimiter> {
    const token: IToken = {
      nodeType: ImageType,
      startIndex: openerDelimiter.startIndex,
      endIndex: closerDelimiter.endIndex,
      destinationContent: closerDelimiter.destinationContent,
      titleContent: closerDelimiter.titleContent,
      children: api.resolveInternalTokens(
        internalTokens,
        openerDelimiter.endIndex,
        closerDelimiter.startIndex,
      ),
    }
    return { tokens: [token] }
  }
}
