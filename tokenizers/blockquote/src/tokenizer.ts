import type { NodePoint } from '@yozora/character'
import type { YastNode, YastNodeType } from '@yozora/tokenizercore'
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
} from '@yozora/tokenizercore-block'
import type {
  Blockquote as Node,
  BlockquoteMatchPhaseState as MS,
  BlockquotePostMatchPhaseState as PMS,
  BlockquoteType as T,
} from './types'
import { AsciiCodePoint, isSpaceCharacter } from '@yozora/character'
import { VirtualCodePoint } from '@yozora/character'
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
  readonly interruptableTypes?: YastNodeType[]
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
  BlockTokenizerParsePhaseHook<T, PMS, Node>
{
  public readonly name: string = 'BlockquoteTokenizer'
  public readonly getContext: BlockTokenizer['getContext'] = () => null

  public readonly isContainerBlock = true
  public readonly interruptableTypes: ReadonlyArray<YastNodeType>
  public readonly recognizedTypes: ReadonlyArray<T> = [BlockquoteType]

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

    const { endIndex, firstNonWhitespaceIndex } = eatingInfo
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
      if (nodePoints[nextIndex].codePoint === VirtualCodePoint.SPACE) {
        nextIndex += 1
      }
    }
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
      isSpaceCharacter(nodePoints[firstNonWhitespaceIndex + 1].codePoint)
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
    postMatchState: Readonly<PMS>,
    children?: YastNode[],
  ): ResultOfParse<T, Node> {
    const node: Node = {
      type: postMatchState.type,
      children: (children || []) as YastNode[],
    }
    return { classification: 'flow', node }
  }
}
