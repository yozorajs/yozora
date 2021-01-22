import type {
  BlockTokenizer,
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseHook,
  BlockTokenizerParsePhaseState,
  BlockTokenizerProps,
  EatingLineInfo,
  ResultOfEatContinuationText,
  ResultOfEatOpener,
  ResultOfParse,
} from '@yozora/tokenizercore-block'
import type {
  Blockquote as PS,
  BlockquoteMatchPhaseState as MS,
  BlockquotePostMatchPhaseState as PMS,
  BlockquoteType as T,
} from './types'
import { AsciiCodePoint } from '@yozora/character'
import { EnhancedYastNodePoint } from '@yozora/tokenizercore'
import {
  BaseBlockTokenizer,
  PhrasingContentType,
} from '@yozora/tokenizercore-block'
import { BlockquoteType } from './types'


/**
 * Params for constructing BlockquoteTokenizer
 */
export interface BlockquoteTokenizerProps extends BlockTokenizerProps {

}


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
export class BlockquoteTokenizer extends BaseBlockTokenizer<T, MS, PMS> implements
  BlockTokenizer<T, MS, PMS>,
  BlockTokenizerMatchPhaseHook<T, MS>,
  BlockTokenizerParsePhaseHook<T, PMS, PS>
{
  public readonly name: string = 'BlockquoteTokenizer'
  public readonly uniqueTypes: T[] = [BlockquoteType]

  public constructor(props: BlockquoteTokenizerProps = {}) {
    super({
      ...props,
      interruptableTypes: props.interruptableTypes || [PhrasingContentType],
    })
  }

  /**
   * @override
   * @see BlockTokenizerMatchPhaseHook
   */
  public eatOpener(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    eatingInfo: EatingLineInfo,
  ): ResultOfEatOpener<T, MS> {
    const { isBlankLine, firstNonWhiteSpaceIndex: idx, endIndex } = eatingInfo
    if (
      isBlankLine ||
      nodePoints[idx].codePoint !== AsciiCodePoint.CLOSE_ANGLE
    ) return null

    /**
     * A block quote marker consists of 0-3 spaces of initial indent, plus
     *  (a) the character > together with a following space, or
     *  (b) a single character > not followed by a space.
     * @see https://github.github.com/gfm/#block-quote-marker
     */
    const nextIndex = (
      idx + 1 < endIndex &&
      nodePoints[idx + 1].codePoint === AsciiCodePoint.SPACE
    )
      ? idx + 2
      : idx + 1

    const state: MS = { type: BlockquoteType }
    return { state, nextIndex }
  }

  /**
   * @override
   * @see BlockTokenizerMatchPhaseHook
   */
  public eatContinuationText(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    eatingInfo: EatingLineInfo,
    state: MS,
    parentState: Readonly<BlockTokenizerMatchPhaseState>,
  ): ResultOfEatContinuationText {
    const { isBlankLine, startIndex, firstNonWhiteSpaceIndex: idx } = eatingInfo

    if (
      isBlankLine ||
      nodePoints[idx].codePoint !== AsciiCodePoint.CLOSE_ANGLE
    ) {
      /**
       * It is a consequence of the Laziness rule that any number of initial
       * `>`s may be omitted on a continuation line of a nested block quote
       * @see https://github.github.com/gfm/#example-229
       */
      if (parentState.type === BlockquoteType) {
        return { nextIndex: startIndex }
      }

      return { failed: true }
    }

    const { endIndex } = eatingInfo
    const nextIndex = (
      idx + 1 < endIndex &&
      nodePoints[idx + 1].codePoint === AsciiCodePoint.SPACE
    )
      ? idx + 2
      : idx + 1
    return { nextIndex }
  }

  /**
   * @override
   * @see BlockTokenizerParsePhaseHook
   */
  public parse(
    postMatchState: Readonly<PMS>,
    children?: BlockTokenizerParsePhaseState[],
  ): ResultOfParse<T, PS> {
    const state: PS = {
      type: postMatchState.type,
      children: (children || []) as BlockTokenizerParsePhaseState[],
    }
    return { classification: 'flow', state }
  }
}
