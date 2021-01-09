import type { EnhancedYastNodePoint } from '@yozora/tokenizercore'
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
export class BlockquoteTokenizer extends BaseBlockTokenizer<T> implements
  BlockTokenizer<T>,
  BlockTokenizerMatchPhaseHook<T, MSD>,
  BlockTokenizerParsePhaseHook<T, MSD, PS>
{
  public readonly name: string = 'BlockquoteTokenizer'
  public readonly uniqueTypes: T[] = [BlockquoteType]

  public constructor(props: BlockTokenizerProps) {
    super({
      ...props,
      interruptableTypes: props.interruptableTypes || [PhrasingContentType],
    })
  }

  /**
   * @override
   * @see BlockTokenizerMatchPhaseHook#eatOpener
   */
  public eatOpener(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    eatingInfo: EatingLineInfo,
    parentState: Readonly<BlockTokenizerMatchPhaseState>,
  ): ResultOfEatOpener<T, MSD> {
    const { isBlankLine, startIndex, firstNonWhiteSpaceIndex: idx, endIndex } = eatingInfo
    if (isBlankLine || nodePoints[idx].codePoint !== AsciiCodePoint.CLOSE_ANGLE) return null

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

    const state: MS = {
      type: BlockquoteType,
      opening: true,
      saturated: false,
      position: {
        start: nodePoints[startIndex],
        end: nodePoints[nextIndex],
      },
      parent: parentState,
      children: [],
    }
    return { state, nextIndex }
  }

  /**
   * @override
   * @see BlockTokenizerMatchPhaseHook#eatContinuationText
   */
  public eatContinuationText(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    eatingInfo: EatingLineInfo,
    state: MS,
  ): ResultOfEatContinuationText<T, MSD> {
    const { isBlankLine, startIndex, firstNonWhiteSpaceIndex: idx } = eatingInfo

    if (isBlankLine || nodePoints[idx].codePoint !== AsciiCodePoint.CLOSE_ANGLE) {
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
    const nextIndex = (
      idx + 1 < endIndex &&
      nodePoints[idx + 1].codePoint === AsciiCodePoint.SPACE
    )
      ? idx + 2
      : idx + 1
    return { state, nextIndex }
  }

  /**
   * @override
   * @see BlockTokenizerParsePhaseHook#parse
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
