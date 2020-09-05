import { AsciiCodePoint } from '@yozora/character'
import { ParagraphDataNodeType } from '@yozora/tokenizer-paragraph'
import { DataNodeTokenPointDetail } from '@yozora/tokenizercore'
import {
  BaseBlockTokenizer,
  BlockTokenizer,
  BlockTokenizerEatingInfo,
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseHook,
  BlockTokenizerParsePhaseState,
  BlockTokenizerPreMatchPhaseHook,
  BlockTokenizerPreMatchPhaseState,
  BlockTokenizerPreParsePhaseState,
} from '@yozora/tokenizercore-block'
import {
  BlockquoteDataNode,
  BlockquoteDataNodeType,
  BlockquoteMatchPhaseState,
  BlockquotePreMatchPhaseState,
} from './types'


type T = BlockquoteDataNodeType


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
export class BlockquoteTokenizer extends BaseBlockTokenizer<T>
  implements
    BlockTokenizer<T>,
    BlockTokenizerPreMatchPhaseHook<
      T,
      BlockquotePreMatchPhaseState>,
    BlockTokenizerMatchPhaseHook<
      T,
      BlockquotePreMatchPhaseState,
      BlockquoteMatchPhaseState>,
    BlockTokenizerParsePhaseHook<
      T,
      BlockquoteMatchPhaseState,
      BlockquoteDataNode>
{
  public readonly name = 'BlockquoteTokenizer'
  public readonly uniqueTypes: T[] = [BlockquoteDataNodeType]

  /**
   * hook of @BlockTokenizerPreMatchPhaseHook
   */
  public eatNewMarker(
    codePositions: DataNodeTokenPointDetail[],
    eatingInfo: BlockTokenizerEatingInfo,
    parentState: Readonly<BlockTokenizerPreMatchPhaseState>,
  ): {
    nextIndex: number,
    state: BlockquotePreMatchPhaseState,
  } | null {
    const { isBlankLine, firstNonWhiteSpaceIndex: idx, endIndex } = eatingInfo
    if (isBlankLine || codePositions[idx].codePoint !== AsciiCodePoint.CLOSE_ANGLE) return null

    const state: BlockquotePreMatchPhaseState = {
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
    if (idx + 1 < endIndex && codePositions[idx + 1].codePoint === AsciiCodePoint.SPACE) {
      return { nextIndex: idx + 2, state }
    }
    return { nextIndex: idx + 1, state }
  }

  /**
   * hook of @BlockTokenizerPreMatchPhaseHook
   */
  public eatAndInterruptPreviousSibling(
    codePositions: DataNodeTokenPointDetail[],
    eatingInfo: BlockTokenizerEatingInfo,
    parentState: Readonly<BlockTokenizerPreMatchPhaseState>,
    previousSiblingState: Readonly<BlockTokenizerPreMatchPhaseState>,
  ): {
    nextIndex: number,
    state: BlockquotePreMatchPhaseState,
    shouldRemovePreviousSibling: boolean,
  } | null {
    const self = this
    switch (previousSiblingState.type) {
      /**
       * Block quotes can interrupt paragraphs
       * @see https://github.github.com/gfm/#example-223
       */
      case ParagraphDataNodeType: {
        const eatingResult = self.eatNewMarker(codePositions, eatingInfo, parentState)
        if (eatingResult == null) return null
        return { ...eatingResult, shouldRemovePreviousSibling: false }
      }
      default:
        return null
    }
  }

  /**
   * hook of @BlockTokenizerPreMatchPhaseHook
   */
  public eatContinuationText(
    codePoints: DataNodeTokenPointDetail[],
    eatingInfo: BlockTokenizerEatingInfo,
    state: BlockquotePreMatchPhaseState,
  ): { nextIndex: number, saturated: boolean } | null {
    const { isBlankLine, startIndex, firstNonWhiteSpaceIndex: idx } = eatingInfo
    if (isBlankLine || codePoints[idx].codePoint !== AsciiCodePoint.CLOSE_ANGLE) {
      /**
       * It is a consequence of the Laziness rule that any number of initial
       * `>`s may be omitted on a continuation line of a nested block quote
       * @see https://github.github.com/gfm/#example-229
       */
      if (state.parent.type === BlockquoteDataNodeType) {
        return { nextIndex: startIndex, saturated: false }
      }
      return null
    }

    const { endIndex } = eatingInfo
    if (idx + 1 < endIndex && codePoints[idx + 1].codePoint === AsciiCodePoint.SPACE) {
      return { nextIndex: idx + 2, saturated: false }
    }
    return { nextIndex: idx + 1, saturated: false }
  }

  /**
   * hook of @BlockTokenizerPreMatchPhaseHook
   */
  public match(
    preMatchPhaseState: BlockquotePreMatchPhaseState,
    matchedChildren: BlockTokenizerMatchPhaseState[],
  ): BlockquoteMatchPhaseState {
    const result: BlockquoteMatchPhaseState = {
      type: preMatchPhaseState.type,
      classify: 'flow',
      children: matchedChildren,
    }
    return result
  }

  /**
   * hook of @BlockTokenizerParsePhaseHook
   */
  public parseFlow(
    matchPhaseState: BlockquoteMatchPhaseState,
    preParsePhaseState: BlockTokenizerPreParsePhaseState,
    children?: BlockTokenizerParsePhaseState[],
  ): BlockquoteDataNode {
    const result: BlockquoteDataNode = {
      type: matchPhaseState.type,
      children: children || [],
    }
    return result
  }
}
