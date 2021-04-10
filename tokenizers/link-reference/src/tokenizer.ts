import type { YastNode } from '@yozora/ast'
import { LinkReferenceType } from '@yozora/ast'
import type { NodePoint } from '@yozora/character'
import { AsciiCodePoint } from '@yozora/character'
import type {
  MatchInlinePhaseApi,
  ResultOfFindDelimiters,
  ResultOfIsDelimiterPair,
  ResultOfProcessDelimiterPair,
  Tokenizer,
  TokenizerMatchInlineHook,
  TokenizerParseInlineHook,
  YastInlineToken,
} from '@yozora/core-tokenizer'
import { BaseTokenizer } from '@yozora/core-tokenizer'
import { resolveLinkLabelAndIdentifier } from '@yozora/tokenizer-definition'
import { checkBalancedBracketsStatus } from '@yozora/tokenizer-link'
import type { Delimiter, Node, T, Token, TokenizerProps } from './types'
import { uniqueName } from './types'

/**
 * Lexical Analyzer for Node.
 *
 * There are three kinds of reference links:
 *  - full: A full reference link consists of a link text immediately followed
 *    by a link label that matches a link reference definition elsewhere in the
 *    document.
 *
 *    A link label begins with a left bracket '[' and ends with the first right
 *    bracket ']' that is not backslash-escaped. Between these brackets there
 *    must be at least one non-whitespace character. Unescaped square bracket
 *    characters are not allowed inside the opening and closing square brackets
 *    of link labels. A link label can have at most 999 characters inside the
 *    square brackets.
 *
 *    One label matches another just in case their normalized forms are equal.
 *    To normalize a label, strip off the opening and closing brackets, perform
 *    the Unicode case fold, strip leading and trailing whitespace and collapse
 *    consecutive internal whitespace to a single space. If there are multiple
 *    matching reference link definitions, the one that comes first in the
 *    document is used. (It is desirable in such cases to emit a warning.)
 *
 *  - collapsed: A collapsed reference link consists of a link label that
 *    matches a link reference definition elsewhere in the document, followed
 *    by the string '[]'. The contents of the first link label are parsed as
 *    inlines, which are used as the link’s text. The link’s URI and title are
 *    provided by the matching reference link definition.
 *    Thus, '[foo][]' is equivalent to '[foo][foo]'.
 *
 *  - shortcut (not support): A shortcut reference link consists of a link label
 *    that matches a link reference definition elsewhere in the document and is
 *    not followed by '[]' or a link label. The contents of the first link label
 *    are parsed as inlines, which are used as the link’s text. The link’s URI
 *    and title are provided by the matching link reference definition.
 *    Thus, '[foo]' is equivalent to '[foo][]'.
 *
 * @see https://github.com/syntax-tree/mdast#linkreference
 * @see https://github.github.com/gfm/#reference-link
 */
export class LinkReferenceTokenizer
  extends BaseTokenizer
  implements
    Tokenizer,
    TokenizerMatchInlineHook<T, Delimiter, Token>,
    TokenizerParseInlineHook<T, Token, Node> {
  public readonly delimiterGroup: string

  /* istanbul ignore next */
  constructor(props: TokenizerProps = {}) {
    super({
      name: uniqueName,
      priority: props.priority,
    })
    this.delimiterGroup = props.delimiterGroup ?? this.name
  }

  /**
   * @override
   * @see TokenizerMatchInlineHook
   */
  public findDelimiter(
    startIndex: number,
    endIndex: number,
    nodePoints: ReadonlyArray<NodePoint>,
    api: Readonly<MatchInlinePhaseApi>,
  ): ResultOfFindDelimiters<Delimiter> {
    for (let i = startIndex; i < endIndex; ++i) {
      const p = nodePoints[i]
      switch (p.codePoint) {
        case AsciiCodePoint.BACKSLASH:
          i += 1
          break
        /**
         * A link text consists of a sequence of zero or more inline elements
         * enclosed by square brackets ([ and ])
         * @see https://github.github.com/gfm/#link-text
         */
        case AsciiCodePoint.OPEN_BRACKET: {
          const delimiter: Delimiter = {
            type: 'opener',
            startIndex: i,
            endIndex: i + 1,
          }
          return delimiter
        }
        case AsciiCodePoint.CLOSE_BRACKET: {
          const closerDelimiter: Delimiter = {
            type: 'closer',
            startIndex: i,
            endIndex: i + 1,
          }

          if (
            i + 1 < endIndex &&
            nodePoints[i + 1].codePoint === AsciiCodePoint.OPEN_BRACKET
          ) {
            // Try to match a link label.
            let j = i + 2
            for (; j < endIndex; ++j) {
              const c = nodePoints[j].codePoint
              if (c === AsciiCodePoint.BACKSLASH) {
                j += 1
                continue
              }

              /**
               * A link label begins with a left bracket ([) and ends with the
               * first right bracket (]) that is not backslash-escaped
               * @see https://github.github.com/gfm/#link-label
               */
              if (c === AsciiCodePoint.OPEN_BRACKET) return closerDelimiter
              if (c === AsciiCodePoint.CLOSE_BRACKET) break
            }

            closerDelimiter.endIndex = j + 1

            /**
             * A link label can have at most 999 characters inside the square
             * brackets.
             *
             * If there are more than 999 characters inside the square and all
             * of them are whitespaces, it will be handled incorrectly. But this
             * situation is too extreme, so I won’t consider it here.
             */
            if (j < endIndex && j - i - 2 <= 999) {
              /**
               * This is an empty square bracket pair, it's only could be part
               * of collapsed reference link
               *
               * A collapsed reference link consists of a link label that matches
               * a link reference definition elsewhere in the document, followed
               * by the string `[]`
               * @see https://github.github.com/gfm/#collapsed-reference-link
               *
               * A link label must contain at least one non-whitespace character
               * @see https://github.github.com/gfm/#example-559
               */
              const labelAndIdentifier = resolveLinkLabelAndIdentifier(
                nodePoints,
                i + 2,
                j,
              )
              if (labelAndIdentifier == null) return closerDelimiter

              const { label, identifier } = labelAndIdentifier
              if (api.getDefinition(identifier) == null) {
                const openerDelimiter: Delimiter = {
                  type: 'opener',
                  startIndex: i + 1,
                  endIndex: i + 2,
                }
                return openerDelimiter
              }

              /**
               * Notice that the `endIndex` is j instead of j+1, because the
               * last character ']' my be part of the next `both` type delimiter.
               */
              const delimiter: Delimiter = {
                type: 'both',
                startIndex: i,
                endIndex: j,
                label,
                identifier,
              }
              return delimiter
            }
          }
          return closerDelimiter
        }
      }
    }
    return null
  }

  /**
   * @override
   * @see TokenizerMatchInlineHook
   */
  public isDelimiterPair(
    openerDelimiter: Delimiter,
    closerDelimiter: Delimiter,
    higherPriorityInnerStates: ReadonlyArray<YastInlineToken>,
    nodePoints: ReadonlyArray<NodePoint>,
    api: Readonly<MatchInlinePhaseApi>,
  ): ResultOfIsDelimiterPair {
    switch (closerDelimiter.type) {
      case 'both': {
        let startIndex = openerDelimiter.startIndex
        switch (openerDelimiter.type) {
          case 'both':
            startIndex += 1
          // eslint-disable-next-line no-fallthrough
          case 'opener': {
            const balancedBracketsStatus:
              | -1
              | 0
              | 1 = checkBalancedBracketsStatus(
              startIndex + 1,
              closerDelimiter.startIndex,
              higherPriorityInnerStates,
              nodePoints,
            )
            if (balancedBracketsStatus !== 0) {
              return { paired: false, opener: true, closer: true }
            }
            return { paired: true }
          }
          default:
            throw new TypeError(
              `[link-reference] bad type of openerDelimiter: (${openerDelimiter.type}).`,
            )
        }
      }
      case 'closer': {
        switch (openerDelimiter.type) {
          /**
           * There is only one possibility that the openerDelimiter and
           * closerDelimiter can form a shortcut / collapsed linkReference:
           *
           *    The content between openerDelimiter and closerDelimiter form a
           *    valid definition identifier.
           *
           * Link label could including innerTokens.
           * @see https://github.github.com/gfm/#example-581
           * @see https://github.github.com/gfm/#example-593
           */
          case 'opener': {
            const startIndex = openerDelimiter.startIndex
            for (let i = startIndex + 1; i < closerDelimiter.startIndex; ++i) {
              switch (nodePoints[i].codePoint) {
                case AsciiCodePoint.BACKSLASH:
                  i += 1
                  break
                /**
                 * A link label begins with a left bracket ([) and ends with the
                 * first right bracket (]) that is not backslash-escaped
                 * @see https://github.github.com/gfm/#link-label
                 */
                case AsciiCodePoint.OPEN_BRACKET:
                case AsciiCodePoint.CLOSE_BRACKET:
                  return { paired: false, opener: true, closer: false }
              }
            }

            const labelAndIdentifier = resolveLinkLabelAndIdentifier(
              nodePoints,
              startIndex + 1,
              closerDelimiter.startIndex,
            )!
            if (
              labelAndIdentifier == null ||
              api.getDefinition(labelAndIdentifier.identifier) == null
            ) {
              return { paired: false, opener: false, closer: false }
            }
            return { paired: true }
          }
          case 'both':
            if (openerDelimiter.endIndex === closerDelimiter.startIndex) {
              return { paired: true }
            }
            return { paired: false, opener: false, closer: true }
          default:
            throw new TypeError(
              `[link-reference] bad type of openerDelimiter: (${openerDelimiter.type}).`,
            )
        }
      }
      default:
        throw new TypeError(
          `[link-reference] bad type of closerDelimiter: (${closerDelimiter.type}).`,
        )
    }
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
    switch (closerDelimiter.type) {
      /**
       * A full reference link consists of a link text immediately followed by
       * a link label that matches a link reference definition elsewhere in the
       * document
       */
      case 'both': {
        let startIndex = openerDelimiter.startIndex
        switch (openerDelimiter.type) {
          case 'both':
            startIndex += 1
          // eslint-disable-next-line no-fallthrough
          case 'opener': {
            const children: YastInlineToken[] = api.resolveFallbackTokens(
              innerTokens,
              startIndex + 1,
              closerDelimiter.startIndex,
              nodePoints,
            )
            const token: Token = {
              nodeType: LinkReferenceType,
              startIndex: startIndex,
              endIndex: closerDelimiter.endIndex + 1,
              referenceType: 'full',
              label: closerDelimiter.label!,
              identifier: closerDelimiter.identifier!,
              children,
            }
            return {
              token,
              shouldInactivateOlderDelimiters: true,
            }
          }
          default:
            throw new TypeError(
              `[link-reference] bad type of openerDelimiter: (${openerDelimiter.type}).`,
            )
        }
      }
      case 'closer': {
        let label: string = openerDelimiter.label!
        let identifier: string = openerDelimiter.identifier!
        let startIndex: number = openerDelimiter.startIndex + 1

        if (openerDelimiter.type === 'opener') {
          startIndex = openerDelimiter.startIndex
          const labelAndIdentifier = resolveLinkLabelAndIdentifier(
            nodePoints,
            startIndex + 1,
            closerDelimiter.startIndex,
          )!
          label = labelAndIdentifier.label
          identifier = labelAndIdentifier.identifier
        }

        const children: YastInlineToken[] = api.resolveFallbackTokens(
          innerTokens,
          startIndex + 1,
          closerDelimiter.startIndex,
          nodePoints,
        )
        const token: Token = {
          nodeType: LinkReferenceType,
          startIndex,
          endIndex: closerDelimiter.endIndex,
          referenceType:
            closerDelimiter.endIndex - closerDelimiter.startIndex > 1
              ? 'collapsed'
              : 'shortcut',
          label,
          identifier,
          children,
        }

        return {
          token,
          shouldInactivateOlderDelimiters: true,
        }
      }
      default:
        throw new TypeError(
          `[link-reference] bad type of closerDelimiter: (${closerDelimiter.type}).`,
        )
    }
  }

  /**
   * @override
   * @see TokenizerParseInlineHook
   */
  public processToken(token: Token, children: YastNode[] | undefined): Node {
    const { identifier, label, referenceType } = token
    const result: Node = {
      type: LinkReferenceType,
      identifier,
      label,
      referenceType,
      children: children || [],
    }
    return result
  }
}
