import type { YastNode } from '@yozora/ast'
import { ImageReferenceType } from '@yozora/ast'
import type { NodePoint } from '@yozora/character'
import { AsciiCodePoint } from '@yozora/character'
import type {
  MatchInlinePhaseApi,
  ResultOfProcessDelimiterPair,
  ResultOfProcessSingleDelimiter,
  Tokenizer,
  TokenizerMatchInlineHook,
  TokenizerParseInlineHook,
  YastInlineToken,
} from '@yozora/core-tokenizer'
import {
  BaseInlineTokenizer,
  TokenizerPriority,
  eatLinkLabel,
} from '@yozora/core-tokenizer'
import { calcImageAlt } from '@yozora/tokenizer-image'
import { checkBalancedBracketsStatus } from '@yozora/tokenizer-link'
import type { LinkReferenceDelimiterBracket } from '@yozora/tokenizer-link-reference'
import type { Delimiter, Node, T, Token, TokenizerProps } from './types'
import { uniqueName } from './types'

/**
 * Lexical Analyzer for ImageReference.
 *
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
export class ImageReferenceTokenizer
  extends BaseInlineTokenizer<Delimiter>
  implements
    Tokenizer,
    TokenizerMatchInlineHook<T, Delimiter, Token>,
    TokenizerParseInlineHook<T, Token, Node>
{
  public readonly delimiterGroup: string

  /* istanbul ignore next */
  constructor(props: TokenizerProps = {}) {
    super({
      name: props.name ?? uniqueName,
      priority: props.priority ?? TokenizerPriority.IMAGES,
    })
    this.delimiterGroup = props.delimiterGroup ?? this.name
  }

  /**
   * @override
   * @see TokenizerMatchInlineHook
   */
  protected override _findDelimiter(
    startIndex: number,
    endIndex: number,
    nodePoints: ReadonlyArray<NodePoint>,
  ): Delimiter | null {
    for (let i = startIndex; i < endIndex; ++i) {
      const c = nodePoints[i].codePoint
      switch (c) {
        case AsciiCodePoint.BACKSLASH:
          i += 1
          break
        case AsciiCodePoint.EXCLAMATION_MARK: {
          if (
            i + 1 >= endIndex ||
            nodePoints[i + 1].codePoint !== AsciiCodePoint.OPEN_BRACKET
          ) {
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
          const delimiter: Delimiter = {
            type: 'closer',
            startIndex: i,
            endIndex: i + 1,
            brackets: [],
          }

          if (
            i + 1 >= endIndex ||
            nodePoints[i + 1].codePoint !== AsciiCodePoint.OPEN_BRACKET
          ) {
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

  /**
   * @override
   * @see TokenizerMatchInlineHook
   */
  public processDelimiterPair(
    openerDelimiter: Delimiter,
    closerDelimiter: Delimiter,
    innerTokens: YastInlineToken[],
    nodePoints: ReadonlyArray<NodePoint>,
    api: Readonly<MatchInlinePhaseApi>,
  ): ResultOfProcessDelimiterPair<T, Token, Delimiter> {
    const bracket = closerDelimiter.brackets[0]
    if (bracket != null && bracket.identifier != null) {
      if (api.hasDefinition(bracket.identifier)) {
        const balancedBracketsStatus: -1 | 0 | 1 = checkBalancedBracketsStatus(
          openerDelimiter.startIndex + 2,
          closerDelimiter.startIndex,
          innerTokens,
          nodePoints,
        )

        switch (balancedBracketsStatus) {
          case -1:
            return {
              token: innerTokens,
              remainCloserDelimiter: closerDelimiter,
            }
          case 1:
            return {
              token: innerTokens,
              remainOpenerDelimiter: openerDelimiter,
            }
          case 0: {
            const token: Token = {
              nodeType: ImageReferenceType,
              startIndex: openerDelimiter.startIndex,
              endIndex: bracket.endIndex,
              referenceType: 'full',
              label: bracket.label!,
              identifier: bracket.identifier,
              children: api.resolveInnerTokens(
                innerTokens,
                openerDelimiter.endIndex,
                closerDelimiter.startIndex,
                nodePoints,
              ),
            }
            return { token: [token] }
          }
        }
      }

      /**
       * A shortcut type of link-reference / image-reference could not followed
       * by a link label (even though it is not defined).
       * @see https://github.github.com/gfm/#example-579
       */
      return { token: innerTokens }
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
      const token: Token = {
        nodeType: ImageReferenceType,
        startIndex: openerDelimiter.startIndex,
        endIndex: closerDelimiter.endIndex,
        referenceType: bracket == null ? 'shortcut' : 'collapsed',
        label: labelAndIdentifier.label,
        identifier: labelAndIdentifier.identifier,
        children: api.resolveInnerTokens(
          innerTokens,
          openerDelimiter.endIndex,
          closerDelimiter.startIndex,
          nodePoints,
        ),
      }
      return { token: [token] }
    }

    return { token: innerTokens }
  }

  /**
   * @override
   * @see TokenizerParseInlineHook
   */
  public processToken(token: Token, children?: YastNode[]): Node {
    const { identifier, label, referenceType } = token

    // calc alt
    const alt = calcImageAlt(children || [])

    const result: Node = {
      type: ImageReferenceType,
      identifier,
      label,
      referenceType,
      alt,
    }
    return result
  }
}
