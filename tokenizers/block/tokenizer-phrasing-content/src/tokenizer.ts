import {
  DataNodeTokenPointDetail,
  calcTrimBoundaryOfCodePoints,
} from '@yozora/tokenizercore'
import {
  BaseBlockTokenizer,
  BlockTokenizer,
  BlockTokenizerEatingInfo,
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseHook,
  BlockTokenizerPreMatchPhaseHook,
  BlockTokenizerPreMatchPhaseState,
  BlockTokenizerPreParsePhaseState,
} from '@yozora/tokenizercore-block'
import { PhrasingContentDataNode, PhrasingContentDataNodeType } from './types'


type T = PhrasingContentDataNodeType


/**
 * State of pre-match phase of PhrasingContentTokenizer
 */
export interface PhrasingContentTokenizerPreMatchPhaseState
  extends BlockTokenizerPreMatchPhaseState<T> {
  /**
   * PhrasingContent 中的文本内容
   */
  contents: DataNodeTokenPointDetail[]
}


/**
 * State of match phase of PhrasingContentTokenizer
 */
export interface PhrasingContentTokenizerMatchPhaseState
  extends BlockTokenizerMatchPhaseState<T> {
  /**
   * phrasingContent 中的文本内容
   */
  contents: DataNodeTokenPointDetail[]
}


/**
 * Lexical Analyzer for PhrasingContentDataNode
 *
 * A sequence of non-blank lines that cannot be interpreted as other kinds
 * of blocks forms a phrasingContent. The contents of the phrasingContent are the result
 * of parsing the phrasingContent’s raw content as inlines. The phrasingContent’s raw
 * content is formed by concatenating the lines and removing initial and
 * final whitespace.
 * @see https://github.github.com/gfm/#phrasingcontents
 */
export class PhrasingContentTokenizer extends BaseBlockTokenizer<T>
  implements
    BlockTokenizer<T>,
    BlockTokenizerPreMatchPhaseHook<
      T,
      PhrasingContentTokenizerPreMatchPhaseState>,
    BlockTokenizerMatchPhaseHook<
      T,
      PhrasingContentTokenizerPreMatchPhaseState,
      PhrasingContentTokenizerMatchPhaseState>,
    BlockTokenizerParsePhaseHook<
      T,
      PhrasingContentTokenizerMatchPhaseState,
      PhrasingContentDataNode>
{
  public readonly name = 'PhrasingContentTokenizer'
  public readonly uniqueTypes: T[] = [PhrasingContentDataNodeType]

  /**
   * hook of @BlockTokenizerPreMatchPhaseHook
   */
  public eatNewMarker(
    codePositions: DataNodeTokenPointDetail[],
    eatingInfo: BlockTokenizerEatingInfo,
    parentState: Readonly<BlockTokenizerPreMatchPhaseState>,
  ): { nextIndex: number, state: PhrasingContentTokenizerPreMatchPhaseState } | null {
    if (eatingInfo.isBlankLine) return null
    const { endIndex, firstNonWhiteSpaceIndex } = eatingInfo
    const state: PhrasingContentTokenizerPreMatchPhaseState = {
      type: PhrasingContentDataNodeType,
      opening: true,
      parent: parentState,
      contents: codePositions.slice(firstNonWhiteSpaceIndex, endIndex),
    }
    return { nextIndex: endIndex, state }
  }

  /**
   * hook of @BlockTokenizerPreMatchPhaseHook
   */
  public eatContinuationText(
    codePositions: DataNodeTokenPointDetail[],
    eatingInfo: BlockTokenizerEatingInfo,
    state: PhrasingContentTokenizerPreMatchPhaseState,
  ): { nextIndex: number, saturated: boolean } | null {
    /**
     * PhrasingContents can contain multiple lines, but no blank lines
     * @see https://github.github.com/gfm/#example-190
     */
    if (eatingInfo.isBlankLine) return null
    const { endIndex, firstNonWhiteSpaceIndex } = eatingInfo

    /**
     * Leading spaces are skipped
     * @see https://github.github.com/gfm/#example-192
     */
    for (let i = firstNonWhiteSpaceIndex; i < endIndex; ++i) {
      state.contents.push(codePositions[i])
    }
    return { nextIndex: endIndex, saturated: false }
  }

  /**
   * hook of @BlockTokenizerPreMatchPhaseHook
   */
  public eatLazyContinuationText(
    codePositions: DataNodeTokenPointDetail[],
    eatingInfo: BlockTokenizerEatingInfo,
    state: PhrasingContentTokenizerPreMatchPhaseState,
  ): { nextIndex: number, saturated: boolean } | null {
    return this.eatContinuationText(codePositions, eatingInfo, state)
  }

  /**
   * hook of @BlockTokenizerMatchPhaseHook
   */
  public match(
    preMatchPhaseState: PhrasingContentTokenizerPreMatchPhaseState,
  ): PhrasingContentTokenizerMatchPhaseState {
    /**
     * Do trim
     *
     * Final spaces are stripped before inline parsing, so a phrasingContent that
     * ends with two or more spaces will not end with a hard line break
     * @see https://github.github.com/gfm/#example-196
     */
    let { contents } = preMatchPhaseState
    const [leftIndex, rightIndex] = calcTrimBoundaryOfCodePoints(contents)
    if (rightIndex - leftIndex < contents.length) {
      contents = contents.slice(leftIndex, rightIndex)
    }

    const result: PhrasingContentTokenizerMatchPhaseState = {
      type: preMatchPhaseState.type,
      classify: 'flow',
      contents: contents,
    }
    return result
  }

  /**
   * hook of @BlockTokenizerParsePhaseHook
   */
  public parseFlow(
    matchPhaseState: PhrasingContentTokenizerMatchPhaseState,
    preParsePhaseState: BlockTokenizerPreParsePhaseState,
  ): PhrasingContentDataNode {
    const self = this
    const result: PhrasingContentDataNode = {
      type: matchPhaseState.type,
      contents: [],
    }
    if (self.parseInlineData != null) {
      const innerData = self.parseInlineData(
        matchPhaseState.contents, 0,
        matchPhaseState.contents.length, preParsePhaseState.meta)
      result.contents = innerData
    }
    return result
  }
}
