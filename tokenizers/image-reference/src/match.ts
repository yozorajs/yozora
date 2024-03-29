import { ImageReferenceType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import { AsciiCodePoint } from '@yozora/character'
import type {
  IInlineToken,
  IMatchInlineHookCreator,
  IResultOfIsDelimiterPair,
  IResultOfProcessDelimiterPair,
} from '@yozora/core-tokenizer'
import { eatLinkLabel, genFindDelimiter } from '@yozora/core-tokenizer'
import { checkBalancedBracketsStatus } from '@yozora/tokenizer-link'
import type { IDelimiter, IThis, IToken, T } from './types'

/**
 * Syntax for image-references is like the syntax for link-references, with one
 * difference. Instead of link text, we have an image description. The rules for
 * this are the same as for link text, except that
 *
 *  a) an image description starts with '![' rather than '[', and
 *  b) an image description may contain links.
 *
 * An image description has inline elements as its contents. When an image is
 * rendered to HTML, this is standardly used as the image’s alt attribute.
 *
 * One type of opener delimiter: '!['
 *
 * Three types of closer delimiter: ']', '][]' something like '][bar]'
 *
 * ------
 *
 * A 'opener' type delimiter is one of the following forms:
 *
 *  - '!['
 *
 * A 'closer' type delimiter is one of the following forms:
 *
 *  - ']'
 *  - '][]'
 *  - '][identifier]'
 *
 * @see https://github.com/syntax-tree/mdast#imagereference
 * @see https://github.github.com/gfm/#images
 */
export const match: IMatchInlineHookCreator<T, IDelimiter, IToken, IThis> = function (api) {
  return {
    findDelimiter: () => genFindDelimiter<IDelimiter>(_findDelimiter),
    isDelimiterPair,
    processDelimiterPair,
  }

  function _findDelimiter(startIndex: number, endIndex: number): IDelimiter | null {
    const nodePoints: ReadonlyArray<INodePoint> = api.getNodePoints()

    for (let i = startIndex; i < endIndex; ++i) {
      const c = nodePoints[i].codePoint
      switch (c) {
        case AsciiCodePoint.BACKSLASH:
          i += 1
          break
        case AsciiCodePoint.EXCLAMATION_MARK: {
          if (i + 1 >= endIndex || nodePoints[i + 1].codePoint !== AsciiCodePoint.OPEN_BRACKET) {
            break
          }

          return {
            type: 'opener',
            startIndex: i,
            endIndex: i + 2,
            brackets: [],
          }
        }
        case AsciiCodePoint.CLOSE_BRACKET: {
          const delimiter: IDelimiter = {
            type: 'closer',
            startIndex: i,
            endIndex: i + 1,
            brackets: [],
          }

          if (i + 1 >= endIndex || nodePoints[i + 1].codePoint !== AsciiCodePoint.OPEN_BRACKET) {
            return delimiter
          }

          const result = eatLinkLabel(nodePoints, i + 1, endIndex)

          // It's something like ']['
          if (result.nextIndex < 0) return delimiter

          // It's something like '][]'
          if (result.labelAndIdentifier == null) {
            return {
              type: 'closer',
              startIndex: i,
              endIndex: result.nextIndex,
              brackets: [
                {
                  startIndex: i + 1,
                  endIndex: result.nextIndex,
                },
              ],
            }
          }

          return {
            type: 'closer',
            startIndex: i,
            endIndex: result.nextIndex,
            brackets: [
              {
                startIndex: i + 1,
                endIndex: result.nextIndex,
                label: result.labelAndIdentifier.label,
                identifier: result.labelAndIdentifier.identifier,
              },
            ],
          }
        }
      }
    }
    return null
  }

  function isDelimiterPair(
    openerDelimiter: IDelimiter,
    closerDelimiter: IDelimiter,
    internalTokens: ReadonlyArray<IInlineToken>,
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
    internalTokens: ReadonlyArray<IInlineToken>,
  ): IResultOfProcessDelimiterPair<T, IToken, IDelimiter> {
    const nodePoints: ReadonlyArray<INodePoint> = api.getNodePoints()
    const bracket = closerDelimiter.brackets[0]
    if (bracket != null && bracket.identifier != null) {
      if (api.hasDefinition(bracket.identifier)) {
        const token: IToken = {
          nodeType: ImageReferenceType,
          startIndex: openerDelimiter.startIndex,
          endIndex: bracket.endIndex,
          referenceType: 'full',
          label: bracket.label!,
          identifier: bracket.identifier,
          children: api.resolveInternalTokens(
            internalTokens,
            openerDelimiter.endIndex,
            closerDelimiter.startIndex,
          ),
        }
        return { tokens: [token] }
      }

      /**
       * A shortcut type of link-reference / image-reference could not followed
       * by a link label (even though it is not defined).
       * @see https://github.github.com/gfm/#example-579
       */
      return { tokens: internalTokens }
    }

    const { nextIndex, labelAndIdentifier } = eatLinkLabel(
      nodePoints,
      openerDelimiter.endIndex - 1,
      closerDelimiter.startIndex + 1,
    )
    if (
      nextIndex === closerDelimiter.startIndex + 1 &&
      labelAndIdentifier != null &&
      api.hasDefinition(labelAndIdentifier.identifier)
    ) {
      const token: IToken = {
        nodeType: ImageReferenceType,
        startIndex: openerDelimiter.startIndex,
        endIndex: closerDelimiter.endIndex,
        referenceType: bracket == null ? 'shortcut' : 'collapsed',
        label: labelAndIdentifier.label,
        identifier: labelAndIdentifier.identifier,
        children: api.resolveInternalTokens(
          internalTokens,
          openerDelimiter.endIndex,
          closerDelimiter.startIndex,
        ),
      }
      return { tokens: [token] }
    }

    return { tokens: internalTokens }
  }
}
