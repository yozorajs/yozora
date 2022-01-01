import type { IYastNode } from '@yozora/ast'
import { BlockquoteType } from '@yozora/ast'
import { AsciiCodePoint, VirtualCodePoint, isSpaceCharacter } from '@yozora/character'
import type {
  IPhrasingContentLine,
  IResultOfEatAndInterruptPreviousSibling,
  IResultOfEatContinuationText,
  IResultOfEatOpener,
  IResultOfParse,
  ITokenizer,
  ITokenizerMatchBlockHook,
  ITokenizerParseBlockHook,
  IYastBlockToken,
} from '@yozora/core-tokenizer'
import {
  BaseBlockTokenizer,
  TokenizerPriority,
  calcEndYastNodePoint,
  calcStartYastNodePoint,
} from '@yozora/core-tokenizer'
import type { INode, IToken, ITokenizerProps, T } from './types'
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
  extends BaseBlockTokenizer
  implements
    ITokenizer,
    ITokenizerMatchBlockHook<T, IToken>,
    ITokenizerParseBlockHook<T, IToken, INode>
{
  public override readonly isContainingBlock = true

  /* istanbul ignore next */
  constructor(props: ITokenizerProps = {}) {
    super({
      name: props.name ?? uniqueName,
      priority: props.priority ?? TokenizerPriority.CONTAINING_BLOCK,
    })
  }

  /**
   * @override
   * @see ITokenizerMatchBlockHook
   */
  public eatOpener(line: Readonly<IPhrasingContentLine>): IResultOfEatOpener<T, IToken> {
    /**
     * The '>' characters can be indented 1-3 spaces
     * @see https://github.github.com/gfm/#example-209
     */
    if (line.countOfPrecedeSpaces >= 4) return null

    const { nodePoints, startIndex, endIndex, firstNonWhitespaceIndex } = line
    if (
      firstNonWhitespaceIndex >= endIndex ||
      nodePoints[firstNonWhitespaceIndex].codePoint !== AsciiCodePoint.CLOSE_ANGLE
    )
      return null

    /**
     * A block quote marker consists of 0-3 spaces of initial indent, plus
     *  (a) the character > together with a following space, or
     *  (b) a single character > not followed by a space.
     * @see https://github.github.com/gfm/#block-quote-marker
     */
    let nextIndex = firstNonWhitespaceIndex + 1
    if (nextIndex < endIndex && isSpaceCharacter(nodePoints[nextIndex].codePoint)) {
      nextIndex += 1
      /**
       * When the '>' followed by a tab, it is treated as if it were expanded
       * into three spaces.
       * @see https://github.github.com/gfm/#example-6
       */
      if (nextIndex < endIndex && nodePoints[nextIndex].codePoint === VirtualCodePoint.SPACE) {
        nextIndex += 1
      }
    }

    const token: IToken = {
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
   * @see ITokenizerMatchBlockHook
   */
  public eatAndInterruptPreviousSibling(
    line: Readonly<IPhrasingContentLine>,
    prevSiblingToken: Readonly<IYastBlockToken>,
  ): IResultOfEatAndInterruptPreviousSibling<T, IToken> {
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
   * @see ITokenizerMatchBlockHook
   */
  public eatContinuationText(
    line: Readonly<IPhrasingContentLine>,
    token: IToken,
    parentToken: Readonly<IYastBlockToken>,
  ): IResultOfEatContinuationText {
    const { nodePoints, startIndex, endIndex, firstNonWhitespaceIndex, countOfPrecedeSpaces } = line

    if (
      countOfPrecedeSpaces >= 4 ||
      firstNonWhitespaceIndex >= endIndex ||
      nodePoints[firstNonWhitespaceIndex].codePoint !== AsciiCodePoint.CLOSE_ANGLE
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
   * @see ITokenizerParseBlockHook
   */
  public parseBlock(token: Readonly<IToken>, children: IYastNode[]): IResultOfParse<T, INode> {
    const node: INode = { type: BlockquoteType, children }
    return node
  }
}
