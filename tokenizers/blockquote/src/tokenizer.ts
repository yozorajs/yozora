import type { YastNodePoint } from '@yozora/tokenizercore'
import type {
  BlockTokenizer,
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseHook,
  BlockTokenizerParsePhaseState,
  EatingLineInfo,
  ResultOfEatContinuationText,
  ResultOfEatOpener,
  ResultOfParse,
  YastBlockNodeType,
} from '@yozora/tokenizercore-block'
import type {
  Blockquote as PS,
  BlockquoteMatchPhaseState as MS,
  BlockquoteMatchPhaseStateData as MSD,
  BlockquoteType as T,
} from './types'
import { AsciiCodePoint } from '@yozora/character'
import {
  BaseBlockTokenizer,
  PhrasingContentType,
} from '@yozora/tokenizercore-block'
import { BlockquoteType } from './types'


/**
 * Lexical Analyzer for Blockquote
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
export class BlockquoteTokenizer extends BaseBlockTokenizer<T, MSD> implements
  BlockTokenizer<T, MSD>,
  BlockTokenizerMatchPhaseHook<T, MSD>,
  BlockTokenizerParsePhaseHook<T, MSD, PS>
{
  public readonly name = 'BlockquoteTokenizer'
  public readonly uniqueTypes: T[] = [BlockquoteType]
  public readonly interruptableTypes: YastBlockNodeType[] = [PhrasingContentType]

  /**
   * hook of @BlockTokenizerMatchPhaseHook
   */
  public eatOpener(
    nodePoints: YastNodePoint[],
    eatingInfo: EatingLineInfo,
    parentState: Readonly<BlockTokenizerMatchPhaseState>,
  ): ResultOfEatOpener<T, MSD> {
    const { isBlankLine, firstNonWhiteSpaceIndex: idx, endIndex } = eatingInfo
    if (isBlankLine || nodePoints[idx].codePoint !== AsciiCodePoint.CLOSE_ANGLE) return null

    const state: MS = {
      type: BlockquoteType,
      opening: true,
      saturated: false,
      parent: parentState,
      children: [],
    }

    /**
     * A block quote marker consists of 0-3 spaces of initial indent, plus
     *  (a) the character > together with a following space, or
     *  (b) a single character > not followed by a space.
     * @see https://github.github.com/gfm/#block-quote-marker
     */
    if (idx + 1 < endIndex && nodePoints[idx + 1].codePoint === AsciiCodePoint.SPACE) {
      return { nextIndex: idx + 2, state }
    }
    return { nextIndex: idx + 1, state }
  }

  /**
   * hook of @BlockTokenizerMatchPhaseHook
   */
  public couldInterruptPreviousSibling(
    type: YastBlockNodeType,
    priority: number,
  ): boolean {
    if (this.priority < priority) return false
    return this.interruptableTypes.includes(type)
  }

  /**
   * hook of @BlockTokenizerMatchPhaseHook
   */
  public eatContinuationText(
    codePoints: YastNodePoint[],
    eatingInfo: EatingLineInfo,
    state: MS,
  ): ResultOfEatContinuationText<T, MSD> {
    const { isBlankLine, startIndex, firstNonWhiteSpaceIndex: idx } = eatingInfo
    if (isBlankLine || codePoints[idx].codePoint !== AsciiCodePoint.CLOSE_ANGLE) {
      /**
       * It is a consequence of the Laziness rule that any number of initial
       * `>`s may be omitted on a continuation line of a nested block quote
       * @see https://github.github.com/gfm/#example-229
       */
      if (state.parent.type === BlockquoteType) {
        return { state, nextIndex: startIndex }
      }
      return null
    }

    const { endIndex } = eatingInfo
    if (idx + 1 < endIndex && codePoints[idx + 1].codePoint === AsciiCodePoint.SPACE) {
      return { state, nextIndex: idx + 2 }
    }
    return { state, nextIndex: idx + 1 }
  }

  /**
   * hook of @BlockTokenizerParsePhaseHook
   */
  public parse(
    matchPhaseStateData: MSD,
    children?: BlockTokenizerParsePhaseState[],
  ): ResultOfParse<T, PS> {
    const state: PS = {
      type: matchPhaseStateData.type,
      children: children || [],
    }
    return { classification: 'flow', state }
  }
}
