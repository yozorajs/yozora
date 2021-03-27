import type { YastNode } from '@yozora/ast'
import { BlockquoteType } from '@yozora/ast'
import {
  AsciiCodePoint,
  VirtualCodePoint,
  isSpaceCharacter,
} from '@yozora/character'
import type {
  PhrasingContentLine,
  ResultOfEatAndInterruptPreviousSibling,
  ResultOfEatContinuationText,
  ResultOfEatOpener,
  ResultOfParse,
  Tokenizer,
  TokenizerMatchBlockHook,
  TokenizerParseBlockHook,
  YastBlockToken,
} from '@yozora/core-tokenizer'
import {
  BaseTokenizer,
  calcEndYastNodePoint,
  calcStartYastNodePoint,
} from '@yozora/core-tokenizer'
import type { Node, T, Token, TokenizerProps } from './types'
import { uniqueName } from './types'

/**
 * Lexical Analyzer for Blockquote.
 *
 * A block quote marker consists of 0-3 spaces of initial indent, plus
 *  (a) the character > together with a following space, or
 *  (b) a single character > not followed by a space.
 *
 * The following rules define block quotes:
 *  - Basic case. If a string of lines Ls constitute a sequence of blocks Bs,
 *    then the result of prepending a block quote marker to the beginning of
 *    each line in Ls is a block quote containing Bs.
 *
 *  - Laziness. If a string of lines Ls constitute a block quote with contents
 *    Bs, then the result of deleting the initial block quote marker from one
 *    or more lines in which the next non-whitespace character after the block
 *    quote marker is paragraph continuation text is a block quote with Bs as
 *    its content. Paragraph continuation text is text that will be parsed as
 *    part of the content of a paragraph, but does not occur at the beginning
 *    of the paragraph.
 *
 *  - Consecutiveness. A document cannot contain two block quotes in a row
 *    unless there is a blank line between them.
 *
 * @see https://github.com/syntax-tree/mdast#blockquote
 * @see https://github.github.com/gfm/#block-quotes
 */
export class BlockquoteTokenizer
  extends BaseTokenizer
  implements
    Tokenizer,
    TokenizerMatchBlockHook<T, Token>,
    TokenizerParseBlockHook<T, Token, Node> {
  public readonly isContainerBlock = true

  /* istanbul ignore next */
  constructor(props: TokenizerProps = {}) {
    super({
      name: uniqueName,
      priority: props.priority,
    })
  }

  /**
   * @override
   * @see TokenizerMatchBlockHook
   */
  public eatOpener(
    line: Readonly<PhrasingContentLine>,
  ): ResultOfEatOpener<T, Token> {
    /**
     * The '>' characters can be indented 1-3 spaces
     * @see https://github.github.com/gfm/#example-209
     */
    if (line.countOfPrecedeSpaces >= 4) return null

    const { nodePoints, startIndex, endIndex, firstNonWhitespaceIndex } = line
    if (
      firstNonWhitespaceIndex >= endIndex ||
      nodePoints[firstNonWhitespaceIndex].codePoint !==
        AsciiCodePoint.CLOSE_ANGLE
    )
      return null

    /**
     * A block quote marker consists of 0-3 spaces of initial indent, plus
     *  (a) the character > together with a following space, or
     *  (b) a single character > not followed by a space.
     * @see https://github.github.com/gfm/#block-quote-marker
     */
    let nextIndex = firstNonWhitespaceIndex + 1
    if (
      nextIndex < endIndex &&
      isSpaceCharacter(nodePoints[nextIndex].codePoint)
    ) {
      nextIndex += 1
      /**
       * When the '>' followed by a tab, it is treated as if it were expanded
       * into three spaces.
       * @see https://github.github.com/gfm/#example-6
       */
      if (
        nextIndex < endIndex &&
        nodePoints[nextIndex].codePoint === VirtualCodePoint.SPACE
      ) {
        nextIndex += 1
      }
    }

    const token: Token = {
      _tokenizer: this.name,
      nodeType: BlockquoteType,
      position: {
        start: calcStartYastNodePoint(nodePoints, startIndex),
        end: calcEndYastNodePoint(nodePoints, nextIndex - 1),
      },
      children: [],
    }
    return { token, nextIndex }
  }

  /**
   * @override
   * @see TokenizerMatchBlockHook
   */
  public eatAndInterruptPreviousSibling(
    line: Readonly<PhrasingContentLine>,
    prevSiblingToken: Readonly<YastBlockToken>,
  ): ResultOfEatAndInterruptPreviousSibling<T, Token> {
    const result = this.eatOpener(line)
    if (result == null) return null
    return {
      token: result.token,
      nextIndex: result.nextIndex,
      remainingSibling: prevSiblingToken,
    }
  }

  /**
   * @override
   * @see TokenizerMatchBlockHook
   */
  public eatContinuationText(
    line: Readonly<PhrasingContentLine>,
    token: Token,
    parentToken: Readonly<YastBlockToken>,
  ): ResultOfEatContinuationText {
    const {
      nodePoints,
      startIndex,
      endIndex,
      firstNonWhitespaceIndex,
      countOfPrecedeSpaces,
    } = line

    if (
      countOfPrecedeSpaces >= 4 ||
      firstNonWhitespaceIndex >= endIndex ||
      nodePoints[firstNonWhitespaceIndex].codePoint !==
        AsciiCodePoint.CLOSE_ANGLE
    ) {
      /**
       * It is a consequence of the Laziness rule that any number of initial
       * `>`s may be omitted on a continuation line of a nested block quote
       * @see https://github.github.com/gfm/#example-229
       */
      if (parentToken.nodeType === BlockquoteType) {
        return { status: 'opening', nextIndex: startIndex }
      }
      return { status: 'notMatched' }
    }

    const nextIndex =
      firstNonWhitespaceIndex + 1 < endIndex &&
      isSpaceCharacter(nodePoints[firstNonWhitespaceIndex + 1].codePoint)
        ? firstNonWhitespaceIndex + 2
        : firstNonWhitespaceIndex + 1
    return { status: 'opening', nextIndex }
  }

  /**
   * @override
   * @see TokenizerParseBlockHook
   */
  public parseBlock(
    token: Readonly<Token>,
    children?: YastNode[],
  ): ResultOfParse<T, Node> {
    const node: Node = {
      type: BlockquoteType,
      children: (children || []) as YastNode[],
    }
    return { classification: 'flow', node }
  }
}
