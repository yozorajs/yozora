import {
  BaseBlockTokenizer,
  BlockTokenizer,
  BlockTokenizerEatingInfo,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseHook,
  BlockTokenizerPreMatchPhaseHook,
  BlockTokenizerPreMatchPhaseState,
  BlockTokenizerPreParsePhaseState,
} from '@yozora/block-tokenizer-core'
import {
  DataNodeTokenPointDetail,
  calcTrimBoundaryOfCodePoints,
} from '@yozora/tokenizer-core'
import { ParagraphDataNode, ParagraphDataNodeType } from './types'


type T = ParagraphDataNodeType


/**
 * State of pre-match phase of ParagraphTokenizer
 */
export interface ParagraphTokenizerPreMatchPhaseState
  extends BlockTokenizerPreMatchPhaseState<T> {
  /**
   * paragraph 中的文本内容
   */
  content: DataNodeTokenPointDetail[]
}


/**
 * State of match phase of ParagraphTokenizer
 */
export interface ParagraphTokenizerMatchPhaseState
  extends BlockTokenizerMatchPhaseState<T> {
  /**
   * paragraph 中的文本内容
   */
  content: DataNodeTokenPointDetail[]
}


/**
 * Lexical Analyzer for ParagraphDataNode
 *
 * A sequence of non-blank lines that cannot be interpreted as other kinds
 * of blocks forms a paragraph. The contents of the paragraph are the result
 * of parsing the paragraph’s raw content as inlines. The paragraph’s raw
 * content is formed by concatenating the lines and removing initial and
 * final whitespace.
 * @see https://github.github.com/gfm/#paragraphs
 */
export class ParagraphTokenizer extends BaseBlockTokenizer<T>
  implements
    BlockTokenizer<T>,
    BlockTokenizerPreMatchPhaseHook<T, ParagraphTokenizerPreMatchPhaseState>,
    BlockTokenizerParsePhaseHook<T, ParagraphTokenizerMatchPhaseState, ParagraphDataNode>
{
  public readonly name = 'ParagraphTokenizer'
  public readonly uniqueTypes: T[] = [ParagraphDataNodeType]

  /**
   * hook of @BlockTokenizerPreMatchPhaseHook
   */
  public eatNewMarker(
    codePositions: DataNodeTokenPointDetail[],
    eatingInfo: BlockTokenizerEatingInfo,
    parentState: Readonly<BlockTokenizerPreMatchPhaseState>,
  ): { nextIndex: number, state: ParagraphTokenizerPreMatchPhaseState } | null {
    if (eatingInfo.isBlankLine) return null
    const { endIndex, firstNonWhiteSpaceIndex } = eatingInfo
    const state: ParagraphTokenizerPreMatchPhaseState = {
      type: ParagraphDataNodeType,
      opening: true,
      parent: parentState,
      content: codePositions.slice(firstNonWhiteSpaceIndex, endIndex),
    }
    return { nextIndex: endIndex, state }
  }

  /**
   * hook of @BlockTokenizerPreMatchPhaseHook
   */
  public eatContinuationText(
    codePositions: DataNodeTokenPointDetail[],
    eatingInfo: BlockTokenizerEatingInfo,
    state: ParagraphTokenizerPreMatchPhaseState,
  ): number | -1 {
    /**
     * Paragraphs can contain multiple lines, but no blank lines
     * @see https://github.github.com/gfm/#example-190
     */
    if (eatingInfo.isBlankLine) return -1
    const { endIndex, firstNonWhiteSpaceIndex } = eatingInfo

    /**
     * Leading spaces are skipped
     * @see https://github.github.com/gfm/#example-192
     */
    for (let i = firstNonWhiteSpaceIndex; i < endIndex; ++i) {
      state.content.push(codePositions[i])
    }
    return endIndex
  }

  /**
   * hook of @BlockTokenizerPreMatchPhaseHook
   */
  public eatLazyContinuationText(
    codePositions: DataNodeTokenPointDetail[],
    eatingInfo: BlockTokenizerEatingInfo,
    state: ParagraphTokenizerPreMatchPhaseState,
  ): number | -1 {
    return this.eatContinuationText(codePositions, eatingInfo, state)
  }

  /**
   * hook of @BlockTokenizerMatchPhaseHook
   */
  public match(
    preMatchPhaseState: ParagraphTokenizerPreMatchPhaseState,
  ): ParagraphTokenizerMatchPhaseState {
    /**
     * Do trim
     *
     * Final spaces are stripped before inline parsing, so a paragraph that
     * ends with two or more spaces will not end with a hard line break
     * @see https://github.github.com/gfm/#example-196
     */
    let content = preMatchPhaseState.content
    const [leftIndex, rightIndex] = calcTrimBoundaryOfCodePoints(content)
    if (rightIndex - leftIndex < content.length) {
      content = content.slice(leftIndex, rightIndex)
    }

    const result: ParagraphTokenizerMatchPhaseState = {
      type: preMatchPhaseState.type,
      classify: 'flow',
      content,
    }
    return result
  }

  /**
   * hook of @BlockTokenizerParseFlowPhaseHook
   */
  public parseFlow(
    matchPhaseState: ParagraphTokenizerMatchPhaseState,
    preParsePhaseState: BlockTokenizerPreParsePhaseState,
  ): ParagraphDataNode {
    const self = this
    const result: ParagraphDataNode = {
      type: matchPhaseState.type,
      data: {
        children: [],
      }
    }
    if (self.parseInlineData != null) {
      const innerData = self.parseInlineData(
        matchPhaseState.content, 0, matchPhaseState.content.length, preParsePhaseState.meta)
      result.data!.children = innerData
    }
    return result
  }
}
