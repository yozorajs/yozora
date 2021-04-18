import { FootnoteReferenceType } from '@yozora/ast'
import type { NodePoint } from '@yozora/character'
import { AsciiCodePoint } from '@yozora/character'
import type {
  MatchInlinePhaseApi,
  ResultOfFindDelimiters,
  ResultOfProcessFullDelimiter,
  Tokenizer,
  TokenizerMatchInlineHook,
  TokenizerParseInlineHook,
} from '@yozora/core-tokenizer'
import { BaseTokenizer, TokenizerPriority } from '@yozora/core-tokenizer'
import { resolveLinkLabelAndIdentifier } from '@yozora/tokenizer-definition'
import { eatFootnoteLabel } from '@yozora/tokenizer-footnote-definition'
import type { Delimiter, Node, T, Token, TokenizerProps } from './types'
import { uniqueName } from './types'

/**
 * Lexical Analyzer for reference link.
 *
 * There are three kinds of reference footnotes:
 *  - full: A full reference footnote consists of a footnote text immediately followed
 *    by a footnote label that matches a footnote reference definition elsewhere in the
 *    document.
 *
 *    A footnote label begins with a left bracket '[' and ends with the first right
 *    bracket ']' that is not backslash-escaped. Between these brackets there
 *    must be at least one non-whitespace character. Unescaped square bracket
 *    characters are not allowed inside the opening and closing square brackets
 *    of footnote labels. A footnote label can have at most 999 characters inside the
 *    square brackets.
 *
 *    One label matches another just in case their normalized forms are equal.
 *    To normalize a label, strip off the opening and closing brackets, perform
 *    the Unicode case fold, strip leading and trailing whitespace and collapse
 *    consecutive internal whitespace to a single space. If there are multiple
 *    matching reference footnote definitions, the one that comes first in the
 *    document is used. (It is desirable in such cases to emit a warning.)
 *
 *  - collapsed: A collapsed reference footnote consists of a footnote label that
 *    matches a footnote reference definition elsewhere in the document, followed
 *    by the string '[]'. The contents of the first footnote label are parsed as
 *    inlines, which are used as the footnote’s text. The footnote’s URI and title are
 *    provided by the matching reference footnote definition.
 *    Thus, '[foo][]' is equivalent to '[foo][foo]'.
 *
 *  - shortcut (not support): A shortcut reference footnote consists of a footnote label
 *    that matches a footnote reference definition elsewhere in the document and is
 *    not followed by '[]' or a footnote label. The contents of the first footnote label
 *    are parsed as inlines, which are used as the footnote’s text. The footnote’s URI
 *    and title are provided by the matching footnote reference definition.
 *    Thus, '[foo]' is equivalent to '[foo][]'.
 *
 * @see https://github.com/syntax-tree/mdast#footnotereference
 * @see https://github.github.com/gfm/#reference-footnote
 */
export class FootnoteReferenceTokenizer
  extends BaseTokenizer
  implements
    Tokenizer,
    TokenizerMatchInlineHook<T, Delimiter, Token>,
    TokenizerParseInlineHook<T, Token, Node> {
  public readonly delimiterGroup: string

  /* istanbul ignore next */
  constructor(props: TokenizerProps = {}) {
    super({
      name: props.name ?? uniqueName,
      priority: props.priority ?? TokenizerPriority.ATOMIC,
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
  ): ResultOfFindDelimiters<Delimiter> {
    for (let i = startIndex; i < endIndex; ++i) {
      const p = nodePoints[i]
      switch (p.codePoint) {
        case AsciiCodePoint.BACKSLASH:
          i += 1
          break
        /**
         * A footnote text consists of a sequence of zero or more inline elements
         * enclosed by square brackets ([ and ])
         * @see https://github.github.com/gfm/#footnote-text
         */
        case AsciiCodePoint.OPEN_BRACKET: {
          const nextIndex = eatFootnoteLabel(nodePoints, i, endIndex)

          if (nextIndex >= 0) {
            const delimiter: Delimiter = {
              type: 'full',
              startIndex: i,
              endIndex: nextIndex,
            }
            return delimiter
          }

          break
        }
      }
    }
    return null
  }

  /**
   * @override
   * @see TokenizerMatchInlineHook
   */
  public processFullDelimiter(
    fullDelimiter: Delimiter,
    nodePoints: ReadonlyArray<NodePoint>,
    api: Readonly<MatchInlinePhaseApi>,
  ): ResultOfProcessFullDelimiter<T, Token> {
    const labelAndIdentifier = resolveLinkLabelAndIdentifier(
      nodePoints,
      fullDelimiter.startIndex + 2,
      fullDelimiter.endIndex - 1,
    )
    if (labelAndIdentifier == null) return null

    const { label, identifier } = labelAndIdentifier
    if (api.getFootnoteDefinition(identifier) == null) return null

    const token: Token = {
      nodeType: FootnoteReferenceType,
      startIndex: fullDelimiter.startIndex,
      endIndex: fullDelimiter.endIndex,
      label,
      identifier,
    }
    return token
  }

  /**
   * @override
   * @see TokenizerParseInlineHook
   */
  public processToken(token: Token): Node {
    const { identifier, label } = token
    const result: Node = {
      type: FootnoteReferenceType,
      identifier,
      label,
    }
    return result
  }
}
