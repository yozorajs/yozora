import type { NodePoint } from '@yozora/character'
import type {
  BlockTokenizer,
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseHook,
  EatingLineInfo,
  ResultOfEatAndInterruptPreviousSibling,
  ResultOfEatContinuationText,
  ResultOfEatOpener,
  ResultOfParse,
  YastBlockNode,
  YastBlockNodeType,
} from '@yozora/tokenizercore-block'
import type {
  Blockquote as PS,
  BlockquoteMatchPhaseState as MS,
  BlockquotePostMatchPhaseState as PMS,
  BlockquoteType as T,
} from './types'
import { AsciiCodePoint } from '@yozora/character'
import { PhrasingContentType } from '@yozora/tokenizercore-block'
import { BlockquoteType } from './types'


/**
 * Params for constructing BlockquoteTokenizer
 */
export interface BlockquoteTokenizerProps {
  /**
   * YastNode types that can be interrupt by this BlockTokenizer,
   * used in couldInterruptPreviousSibling, you can overwrite that function to
   * mute this properties
   */
  readonly interruptableTypes?: YastBlockNodeType[]
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
export class BlockquoteTokenizer implements
  BlockTokenizer<T, MS, PMS>,
  BlockTokenizerMatchPhaseHook<T, MS>,
  BlockTokenizerParsePhaseHook<T, PMS, PS>
{
  public readonly name: string = 'BlockquoteTokenizer'
  public readonly getContext: BlockTokenizer['getContext'] = () => null

  public readonly isContainerBlock = true
  public readonly recognizedTypes: ReadonlyArray<T> = [BlockquoteType]
  public readonly interruptableTypes: ReadonlyArray<YastBlockNodeType>

  public constructor(props: BlockquoteTokenizerProps = {}) {
    this.interruptableTypes = Array.isArray(props.interruptableTypes)
      ? [...props.interruptableTypes]
      : [PhrasingContentType]
  }

  /**
   * @override
   * @see BlockTokenizerMatchPhaseHook
   */
  public eatOpener(
    nodePoints: ReadonlyArray<NodePoint>,
    eatingInfo: EatingLineInfo,
  ): ResultOfEatOpener<T, MS> {
    /**
     * The '>' characters can be indented 1-3 spaces
     * @see https://github.github.com/gfm/#example-209
     */
    if (eatingInfo.countOfPrecedeSpaces >= 4) return null

    const { firstNonWhitespaceIndex, endIndex } = eatingInfo
    if (
      firstNonWhitespaceIndex >= endIndex ||
      nodePoints[firstNonWhitespaceIndex].codePoint !== AsciiCodePoint.CLOSE_ANGLE
    ) return null

    /**
     * A block quote marker consists of 0-3 spaces of initial indent, plus
     *  (a) the character > together with a following space, or
     *  (b) a single character > not followed by a space.
     * @see https://github.github.com/gfm/#block-quote-marker
     */
    const nextIndex = (
      firstNonWhitespaceIndex + 1 < endIndex &&
      nodePoints[firstNonWhitespaceIndex + 1].codePoint === AsciiCodePoint.SPACE
    )
      ? firstNonWhitespaceIndex + 2
      : firstNonWhitespaceIndex + 1

    const state: MS = { type: BlockquoteType }
    return { state, nextIndex }
  }

  /**
   * @override
   * @see BlockTokenizerMatchPhaseHook
   */
  public eatAndInterruptPreviousSibling(
    nodePoints: ReadonlyArray<NodePoint>,
    eatingInfo: EatingLineInfo,
  ): ResultOfEatAndInterruptPreviousSibling<T, MS> {
    const result = this.eatOpener(nodePoints, eatingInfo)
    return result
  }

  /**
   * @override
   * @see BlockTokenizerMatchPhaseHook
   */
  public eatContinuationText(
    nodePoints: ReadonlyArray<NodePoint>,
    eatingInfo: EatingLineInfo,
    state: MS,
    parentState: Readonly<BlockTokenizerMatchPhaseState>,
  ): ResultOfEatContinuationText {
    const {
      startIndex,
      endIndex,
      firstNonWhitespaceIndex,
      countOfPrecedeSpaces,
    } = eatingInfo

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
      if (parentState.type === BlockquoteType) {
        return { status: 'opening', nextIndex: startIndex }
      }

      return { status: 'notMatched' }
    }

    const nextIndex = (
      firstNonWhitespaceIndex + 1 < endIndex &&
      nodePoints[firstNonWhitespaceIndex + 1].codePoint === AsciiCodePoint.SPACE
    )
      ? firstNonWhitespaceIndex + 2
      : firstNonWhitespaceIndex + 1
    return { status: 'opening', nextIndex }
  }

  /**
   * @override
   * @see BlockTokenizerParsePhaseHook
   */
  public parse(
    nodePoints: ReadonlyArray<NodePoint>,
    postMatchState: Readonly<PMS>,
    children?: YastBlockNode[],
  ): ResultOfParse<T, PS> {
    const state: PS = {
      type: postMatchState.type,
      children: (children || []) as YastBlockNode[],
    }
    return { classification: 'flow', state }
  }
}
