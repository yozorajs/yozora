import { FootnoteReferenceType } from '@yozora/ast'
import type { NodePoint } from '@yozora/character'
import { AsciiCodePoint } from '@yozora/character'
import type {
  MatchInlinePhaseApi,
  ResultOfProcessSingleDelimiter,
  Tokenizer,
  TokenizerMatchInlineHook,
  TokenizerParseInlineHook,
} from '@yozora/core-tokenizer'
import {
  BaseInlineTokenizer,
  TokenizerPriority,
  resolveLinkLabelAndIdentifier,
} from '@yozora/core-tokenizer'
import { eatFootnoteLabel } from '@yozora/tokenizer-footnote-definition'
import type { Delimiter, Node, T, Token, TokenizerProps } from './types'
import { uniqueName } from './types'

/**
 * Lexical Analyzer for footnote reference.
 *
 * A full footnote consists of a footnote label.
 *
 * Unlike the link label, the footnote label should be on the same line and it
 * begins with a left bracket ([) followed by a caret (^), and ends with the
 * first right bracket (]) that is not backslash-escaped. Between the caret of
 * right bracket, there must be at least one non-whitespace character.
 * Unescaped square bracket characters are not allowed inside the opening creat
 * and closing square bracket of footnote labels. A footnote label can have at
 * most 999 characters inside the caret and right bracket.
 *
 * @see https://github.com/syntax-tree/mdast#footnotereference
 * @see https://github.github.com/gfm/#link-label
 */
export class FootnoteReferenceTokenizer
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
      priority: props.priority ?? TokenizerPriority.ATOMIC,
    })
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
            return {
              type: 'full',
              startIndex: i,
              endIndex: nextIndex,
            }
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
  public processSingleDelimiter(
    delimiter: Delimiter,
    nodePoints: ReadonlyArray<NodePoint>,
    api: Readonly<MatchInlinePhaseApi>,
  ): ResultOfProcessSingleDelimiter<T, Token> {
    const labelAndIdentifier = resolveLinkLabelAndIdentifier(
      nodePoints,
      delimiter.startIndex + 2,
      delimiter.endIndex - 1,
    )
    if (labelAndIdentifier == null) return []

    const { label, identifier } = labelAndIdentifier
    if (!api.hasFootnoteDefinition(identifier)) return []

    const token: Token = {
      nodeType: FootnoteReferenceType,
      startIndex: delimiter.startIndex,
      endIndex: delimiter.endIndex,
      label,
      identifier,
    }
    return [token]
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
