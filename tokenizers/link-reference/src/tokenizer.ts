import type { YastNode } from '@yozora/ast'
import { LinkReferenceType } from '@yozora/ast'
import type { NodePoint } from '@yozora/character'
import { AsciiCodePoint } from '@yozora/character'
import {
  BaseInlineTokenizer,
  TokenizerPriority,
  eatLinkLabel,
  isLinkToken,
} from '@yozora/core-tokenizer'
import type {
  MatchInlinePhaseApi,
  ResultOfIsDelimiterPair,
  ResultOfProcessDelimiterPair,
  ResultOfProcessSingleDelimiter,
  Tokenizer,
  TokenizerMatchInlineHook,
  TokenizerParseInlineHook,
  YastInlineToken,
} from '@yozora/core-tokenizer'
import { checkBalancedBracketsStatus } from '@yozora/tokenizer-link'
import type {
  Delimiter,
  LinkReferenceDelimiterBracket,
  Node,
  T,
  Token,
  TokenizerProps,
} from './types'
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
 * ------
 *
 * A 'opener' type delimiter is one of the following forms:
 *
 *  - '['
 *  - '[identifier]['
 *  - '[identifier][identifier2]...[identifierN]['
 *
 * A 'closer' type delimiter is one of the following forms:
 *
 *  - '][identifier]'
 *  - '][identifier][]'
 *  - '][identifier][identifier2]....[identifierN]'
 *  - '][identifier][identifier2]....[identifierN][]'
 *
 * A 'both' type delimiter is one of the following forms:
 *
 *  - '][identifier]['
 *  - '][identifier][identifier2]...[identifierN]['
 *
 * A 'full' type delimiter is one of the following forms:
 *
 *  - '[]'
 *  - '[identifier]'
 *  - '[identifier][]'
 *  - '][identifier][identifier2]....[identifierN]'
 *  - '][identifier][identifier2]....[identifierN][]'
 *
 * @see https://github.com/syntax-tree/mdast#linkreference
 * @see https://github.github.com/gfm/#reference-link
 */
export class LinkReferenceTokenizer
  extends BaseInlineTokenizer<Delimiter>
  implements
    Tokenizer,
    TokenizerMatchInlineHook<T, Delimiter, Token>,
    TokenizerParseInlineHook<T, Token, Node>
{
  /* istanbul ignore next */
  constructor(props: TokenizerProps = {}) {
    super({
      name: props.name ?? uniqueName,
      priority: props.priority ?? TokenizerPriority.LINKS,
    })
  }

  /**
   * @override
   * @see BaseInlineTokenizer
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
        /**
         * A link text consists of a sequence of zero or more inline elements
         * enclosed by square brackets ([ and ])
         * @see https://github.github.com/gfm/#link-text
         */
        case AsciiCodePoint.OPEN_BRACKET: {
          const brackets: LinkReferenceDelimiterBracket[] = []
          const delimiter: Delimiter = {
            type: 'opener',
            startIndex: i,
            endIndex: i + 1,
            brackets,
          }

          const result1 = eatLinkLabel(nodePoints, i, endIndex)
          if (result1.nextIndex < 0) return delimiter

          // preceding '[]' is useless.
          if (result1.labelAndIdentifier == null) {
            i = result1.nextIndex - 1
            break
          }

          brackets.push({
            startIndex: i,
            endIndex: result1.nextIndex,
            label: result1.labelAndIdentifier.label,
            identifier: result1.labelAndIdentifier.identifier,
          })

          for (i = result1.nextIndex; i < endIndex; ) {
            if (nodePoints[i].codePoint !== AsciiCodePoint.OPEN_BRACKET) break
            const { labelAndIdentifier, nextIndex } = eatLinkLabel(
              nodePoints,
              i,
              endIndex,
            )

            // It's something like '[identifier][' or '[identifier1][identifier2]...['
            if (nextIndex === -1) {
              delimiter.type = 'opener'
              delimiter.endIndex = i + 1
              return delimiter
            }

            // It's something like '[identifier][]' or '[identifier1][identifier2]...[]'
            // or '[identifier]' or '[identifier1][identifier2]...[identifierN]'
            const bracket: LinkReferenceDelimiterBracket = {
              startIndex: i,
              endIndex: nextIndex,
            }
            delimiter.type = 'full'
            delimiter.endIndex = nextIndex
            brackets.push(bracket)

            if (labelAndIdentifier == null) break
            bracket.label = labelAndIdentifier.label
            bracket.identifier = labelAndIdentifier.identifier
            i = nextIndex
          }
          return delimiter
        }
        case AsciiCodePoint.CLOSE_BRACKET: {
          if (
            i + 1 >= endIndex ||
            nodePoints[i + 1].codePoint !== AsciiCodePoint.OPEN_BRACKET
          ) {
            break
          }

          const result1 = eatLinkLabel(nodePoints, i + 1, endIndex)

          // It's something like ']['
          if (result1.nextIndex === -1) {
            return {
              type: 'opener',
              startIndex: i + 1,
              endIndex: i + 2,
              brackets: [],
            }
          }

          // It's something like '][]'
          if (result1.labelAndIdentifier == null) {
            i = result1.nextIndex - 1
            break
          }

          const brackets: LinkReferenceDelimiterBracket[] = [
            {
              startIndex: i + 1,
              endIndex: result1.nextIndex,
              label: result1.labelAndIdentifier.label,
              identifier: result1.labelAndIdentifier.identifier,
            },
          ]
          const delimiter: Delimiter = {
            type: 'closer',
            startIndex: i,
            endIndex: result1.nextIndex,
            brackets,
          }

          for (i = result1.nextIndex; i < endIndex; ) {
            if (nodePoints[i].codePoint !== AsciiCodePoint.OPEN_BRACKET) break
            const { labelAndIdentifier, nextIndex } = eatLinkLabel(
              nodePoints,
              i,
              endIndex,
            )

            // It's something like '][identifier][' or '][identifier1][identifier2]...['
            if (nextIndex === -1) {
              delimiter.type = 'both'
              delimiter.endIndex = i + 1
              return delimiter
            }

            // It's something like '][identifier][]' or '][identifier1][identifier2]...[]'
            // or '][identifier]' or '][identifier1][identifier2]...[identifierN]'
            const bracket: LinkReferenceDelimiterBracket = {
              startIndex: i,
              endIndex: nextIndex,
            }
            delimiter.type = 'full'
            delimiter.endIndex = nextIndex
            brackets.push(bracket)

            if (labelAndIdentifier == null) break
            bracket.label = labelAndIdentifier.label
            bracket.identifier = labelAndIdentifier.identifier
            i = nextIndex
          }
          return delimiter
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
    internalTokens: ReadonlyArray<YastInlineToken>,
    nodePoints: ReadonlyArray<NodePoint>,
    api: Readonly<MatchInlinePhaseApi>,
  ): ResultOfIsDelimiterPair {
    /**
     * Links may not contain other links, at any level of nesting.
     * @see https://github.github.com/gfm/#example-540
     * @see https://github.github.com/gfm/#example-541
     */
    const hasInternalLinkToken: boolean =
      internalTokens.find(isLinkToken) != null
    if (hasInternalLinkToken) {
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
      case 0: {
        // The closer delimiter should provide a valid link label, only in this
        // way can it be connected with the opener delimiter to form a complete
        // linkReference.
        const bracket = closerDelimiter.brackets[0]
        if (
          bracket == null ||
          bracket.identifier == null ||
          !api.hasDefinition(bracket.identifier)
        ) {
          return { paired: false, opener: false, closer: false }
        }
        return { paired: true }
      }
      case 1: {
        return { paired: false, opener: true, closer: false }
      }
    }
  }

  /**
   * @override
   * @see TokenizerMatchInlineHook
   */
  public processDelimiterPair(
    openerDelimiter: Delimiter,
    closerDelimiter: Delimiter,
    internalTokens: YastInlineToken[],
    nodePoints: ReadonlyArray<NodePoint>,
    api: Readonly<MatchInlinePhaseApi>,
  ): ResultOfProcessDelimiterPair<T, Token, Delimiter> {
    const tokens: Token[] = this.processSingleDelimiter(
      openerDelimiter,
      nodePoints,
      api,
    )

    /**
     * Shortcut link reference cannot following with a link label
     * (even though it is not defined).
     * @see https://github.github.com/gfm/#example-579
     */
    const [bracket, ...brackets] = closerDelimiter.brackets
    tokens.push({
      nodeType: LinkReferenceType,
      startIndex: openerDelimiter.endIndex - 1,
      endIndex: bracket.endIndex,
      referenceType: 'full',
      label: bracket.label!,
      identifier: bracket.identifier!,
      children: api.resolveInternalTokens(
        internalTokens,
        openerDelimiter.endIndex,
        closerDelimiter.startIndex,
        nodePoints,
      ),
    })

    return {
      tokens,
      remainCloserDelimiter: {
        type: closerDelimiter.type === 'both' ? 'opener' : 'full',
        startIndex: bracket.endIndex,
        endIndex: closerDelimiter.endIndex,
        brackets,
      },
    }
  }

  /**
   * Shortcut link reference cannot following with a link label
   * (even though it is not defined).
   *
   * @override
   * @see TokenizerMatchInlineHook
   * @see https://github.github.com/gfm/#example-579
   */
  public processSingleDelimiter(
    delimiter: Delimiter,
    nodePoints: ReadonlyArray<NodePoint>,
    api: Readonly<MatchInlinePhaseApi>,
  ): ResultOfProcessSingleDelimiter<T, Token> {
    const tokens: Token[] = []
    const brackets = delimiter.brackets
    if (brackets.length <= 0) return tokens

    let bracketIndex = 0
    let lastBracketIndex = -1
    for (; bracketIndex < brackets.length; ++bracketIndex) {
      let bracket: LinkReferenceDelimiterBracket | null = null
      for (; bracketIndex < brackets.length; ++bracketIndex) {
        bracket = brackets[bracketIndex]
        if (bracket.identifier != null && api.hasDefinition(bracket.identifier))
          break
      }

      if (bracket == null || bracketIndex >= brackets.length) break

      // full
      if (lastBracketIndex + 1 < bracketIndex) {
        const bracket0 = brackets[bracketIndex - 1]
        tokens.push({
          nodeType: LinkReferenceType,
          startIndex: bracket0.startIndex,
          endIndex: bracket.endIndex,
          referenceType: 'full',
          label: bracket.label!,
          identifier: bracket.identifier!,
          children: api.resolveInternalTokens(
            [],
            bracket0.startIndex + 1,
            bracket0.endIndex - 1,
            nodePoints,
          ),
        })
        lastBracketIndex = bracketIndex
        continue
      }

      // shortcut
      if (bracketIndex + 1 === brackets.length) {
        tokens.push({
          nodeType: LinkReferenceType,
          startIndex: bracket.startIndex,
          endIndex: bracket.endIndex,
          referenceType: 'shortcut',
          label: bracket.label!,
          identifier: bracket.identifier!,
          children: api.resolveInternalTokens(
            [],
            bracket.startIndex + 1,
            bracket.endIndex - 1,
            nodePoints,
          ),
        })
        break
      }

      // collapsed
      if (
        bracketIndex + 1 < brackets.length &&
        brackets[bracketIndex + 1].identifier == null
      ) {
        const bracket1 = brackets[bracketIndex + 1]
        tokens.push({
          nodeType: LinkReferenceType,
          startIndex: bracket.startIndex,
          endIndex: bracket1.endIndex,
          referenceType: 'collapsed',
          label: bracket.label!,
          identifier: bracket.identifier!,
          children: api.resolveInternalTokens(
            [],
            bracket.startIndex + 1,
            bracket.endIndex - 1,
            nodePoints,
          ),
        })
        break
      }
    }

    return tokens
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
