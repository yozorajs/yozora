import { AsciiCodePoint } from '@yozora/character'
import {
  BaseBlockDataNodeTokenizer,
  BlockDataNode,
  BlockDataNodeEatingLineInfo,
  BlockDataNodeEatingResult,
  BlockDataNodeMatchResult,
  BlockDataNodeMatchState,
  BlockDataNodeTokenizer,
  DataNodeTokenPointDetail,
} from '@yozora/tokenizer-core'
import {
  BlockquoteDataNode,
  BlockquoteDataNodeData,
  BlockquoteDataNodeType,
} from './types'


type T = BlockquoteDataNodeType


export interface BlockquoteDataNodeMatchState extends BlockDataNodeMatchState<T> {
  children: BlockDataNodeMatchState[]
}


export interface BlockquoteDataNodeMatchResult extends BlockDataNodeMatchResult<T> {
  children: BlockDataNodeMatchResult[]
}


/**
 * Lexical Analyzer for BlockquoteDataNode
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
 * @see https://github.github.com/gfm/#block-quotes
 */
export class BlockquoteTokenizer extends BaseBlockDataNodeTokenizer<
  T,
  BlockquoteDataNodeData,
  BlockquoteDataNodeMatchState,
  BlockquoteDataNodeMatchResult>
  implements BlockDataNodeTokenizer<
  T,
  BlockquoteDataNodeData,
  BlockquoteDataNodeMatchState,
  BlockquoteDataNodeMatchResult> {
  public readonly name = 'BlockquoteTokenizer'
  public readonly recognizedTypes: T[] = [BlockquoteDataNodeType]

  /**
   * override
   */
  public eatNewMarker(
    codePoints: DataNodeTokenPointDetail[],
    eatingLineInfo: BlockDataNodeEatingLineInfo,
    parentState: BlockDataNodeMatchState,
  ): BlockDataNodeEatingResult<T, BlockquoteDataNodeMatchState> | null {
    const { isBlankLine, firstNonWhiteSpaceIndex: idx, endIndex } = eatingLineInfo
    if (isBlankLine || codePoints[idx].codePoint !== AsciiCodePoint.CLOSE_ANGLE) return null

    const state: BlockquoteDataNodeMatchState = {
      type: BlockquoteDataNodeType,
      opening: true,
      parent: parentState,
      children: [],
    }

    /**
     * A block quote marker consists of 0-3 spaces of initial indent, plus
     *  (a) the character > together with a following space, or
     *  (b) a single character > not followed by a space.
     * @see https://github.github.com/gfm/#block-quote-marker
     */
    if (idx + 1 < endIndex && codePoints[idx + 1].codePoint === AsciiCodePoint.SPACE) {
      return { nextIndex: idx + 2, state }
    }
    return { nextIndex: idx + 1, state }
  }

  /**
   * override
   */
  public eatContinuationText(
    codePoints: DataNodeTokenPointDetail[],
    eatingLineInfo: BlockDataNodeEatingLineInfo,
    state: BlockquoteDataNodeMatchState,
  ): BlockDataNodeEatingResult<T, BlockquoteDataNodeMatchState> | null {
    const { isBlankLine, startIndex, firstNonWhiteSpaceIndex: idx } = eatingLineInfo
    if (isBlankLine || codePoints[idx].codePoint !== AsciiCodePoint.CLOSE_ANGLE) {
      /**
       * It is a consequence of the Laziness rule that any number of initial
       * `>`s may be omitted on a continuation line of a nested block quote
       * @see https://github.github.com/gfm/#example-229
       */
      if (state.parent.type === BlockquoteDataNodeType) return { nextIndex: startIndex, state }
      return null
    }

    const { endIndex } = eatingLineInfo
    if (idx + 1 < endIndex && codePoints[idx + 1].codePoint === AsciiCodePoint.SPACE) {
      return { nextIndex: idx + 2, state }
    }
    return { nextIndex: idx + 1, state }
  }

  /**
   * override
   */
  public match(
    state: BlockquoteDataNodeMatchState,
    children: BlockDataNodeMatchResult[],
  ): BlockquoteDataNodeMatchResult {
    const result: BlockquoteDataNodeMatchResult = {
      type: state.type,
      children,
    }
    return result
  }

  /**
   * override
   */
  public parse(
    codePoints: DataNodeTokenPointDetail[],
    matchResult: BlockquoteDataNodeMatchResult,
    children?: BlockDataNode[],
  ): BlockquoteDataNode {
    const result: BlockquoteDataNode = {
      type: matchResult.type,
      data: {
        children: children || [],
      }
    }
    return result
  }
}
