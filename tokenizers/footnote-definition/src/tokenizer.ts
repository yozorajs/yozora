import { FootnoteDefinitionType } from '@yozora/ast'
import type { YastNode } from '@yozora/ast'
import { AsciiCodePoint, calcStringFromNodePoints } from '@yozora/character'
import type {
  MatchBlockPhaseApi,
  PhrasingContentLine,
  ResultOfEatContinuationText,
  ResultOfEatOpener,
  ResultOfOnClose,
  ResultOfParse,
  Tokenizer,
  TokenizerMatchBlockHook,
  TokenizerParseBlockHook,
} from '@yozora/core-tokenizer'
import {
  BaseBlockTokenizer,
  TokenizerPriority,
  calcEndYastNodePoint,
  calcStartYastNodePoint,
  resolveLabelToIdentifier,
} from '@yozora/core-tokenizer'
import type { Node, T, Token, TokenizerProps } from './types'
import { uniqueName } from './types'
import { eatFootnoteLabel } from './util'

/**
 * Lexical Analyzer for FootnoteDefinition.
 *
 * A footnote reference definition consists of a footnote label, indented up
 * to three spaces, followed by a colon (:), optional whitespace (including up
 * to one line ending), a footnote contents consisted by paragraph-like strings.
 *
 * Unlike the link label, the footnote label should be on the same line and it
 * begins with a left bracket ([) followed by a caret (^), and ends with the
 * first right bracket (]) that is not backslash-escaped. Between the caret of
 * right bracket, there must be at least one non-whitespace character.
 * Unescaped square bracket characters are not allowed inside the opening creat
 * and closing square bracket of footnote labels. A footnote label can have at
 * most 999 characters inside the caret and right bracket.
 *
 * @see https://github.github.com/gfm/#link-label
 * @see https://github.github.com/gfm/#link-reference-definition
 * @see https://github.com/syntax-tree/mdast-util-footnote
 * @see https://github.com/remarkjs/remark-footnotes
 * @see https://www.markdownguide.org/extended-syntax/#footnotes
 */
export class FootnoteDefinitionTokenizer
  extends BaseBlockTokenizer
  implements
    Tokenizer,
    TokenizerMatchBlockHook<T, Token>,
    TokenizerParseBlockHook<T, Token, Node>
{
  public readonly isContainingBlock = true
  public readonly indent = 4

  /* istanbul ignore next */
  constructor(props: TokenizerProps = {}) {
    super({
      name: props.name ?? uniqueName,
      priority: props.priority ?? TokenizerPriority.CONTAINING_BLOCK,
    })
  }

  /**
   * @override
   * @see TokenizerMatchBlockHook
   */
  public eatOpener(
    line: Readonly<PhrasingContentLine>,
  ): ResultOfEatOpener<T, Token> {
    if (line.countOfPrecedeSpaces >= 4) return null

    const { nodePoints, startIndex, firstNonWhitespaceIndex, endIndex } = line
    const nextIndex = eatFootnoteLabel(
      nodePoints,
      firstNonWhitespaceIndex,
      endIndex,
    )

    // Try to match the following colon (:).
    if (
      nextIndex < 0 ||
      nextIndex >= endIndex ||
      nodePoints[nextIndex].codePoint !== AsciiCodePoint.COLON
    ) {
      return null
    }

    const token: Token = {
      nodeType: FootnoteDefinitionType,
      position: {
        start: calcStartYastNodePoint(nodePoints, startIndex),
        end: calcEndYastNodePoint(nodePoints, nextIndex),
      },
      label: {
        nodePoints,
        startIndex: firstNonWhitespaceIndex,
        endIndex: nextIndex,
      },
      children: [],
    }
    return { token, nextIndex: nextIndex + 1 }
  }

  /**
   * @override
   * @see TokenizerMatchBlockHook
   */
  public eatContinuationText(
    line: Readonly<PhrasingContentLine>,
  ): ResultOfEatContinuationText {
    const {
      startIndex,
      endIndex,
      firstNonWhitespaceIndex,
      countOfPrecedeSpaces,
    } = line

    // Blank line is allowed
    if (firstNonWhitespaceIndex >= endIndex) {
      return {
        status: 'opening',
        nextIndex: Math.min(endIndex - 1, startIndex + this.indent),
      }
    }

    // Indent of a non-blank line is required.
    if (countOfPrecedeSpaces >= this.indent) {
      return { status: 'opening', nextIndex: startIndex + this.indent }
    }

    return { status: 'notMatched' }
  }

  /**
   * @override
   * @see TokenizerMatchBlockHook
   */
  public onClose(
    token: Token,
    api: Readonly<MatchBlockPhaseApi>,
  ): ResultOfOnClose {
    /**
     * Labels are trimmed and case-insensitive
     * @see https://github.github.com/gfm/#example-174
     * @see https://github.github.com/gfm/#example-175
     */
    const label = calcStringFromNodePoints(
      token.label.nodePoints,
      token.label.startIndex + 2,
      token.label.endIndex - 1,
    )
    const identifier = resolveLabelToIdentifier(label)

    // Register definition identifier.
    api.registerFootnoteDefinitionIdentifier(identifier)

    // Cache label and identifier for performance.

    // eslint-disable-next-line no-param-reassign
    token._label = label
    // eslint-disable-next-line no-param-reassign
    token._identifier = identifier
  }

  /**
   * @override
   * @see TokenizerParseBlockHook
   */
  public parseBlock(
    token: Readonly<Token>,
    children: YastNode[],
  ): ResultOfParse<T, Node> {
    const label: string = token._label!
    const identifier: string = token._identifier!

    const node: Node = {
      type: FootnoteDefinitionType,
      identifier,
      label,
      children,
    }
    return node
  }
}
