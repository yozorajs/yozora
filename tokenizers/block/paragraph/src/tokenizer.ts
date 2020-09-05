import { DataNodeTokenPointDetail } from '@yozora/tokenizercore'
import {
  BaseBlockTokenizer,
  BlockTokenizer,
  BlockTokenizerEatContinuationResult,
  BlockTokenizerEatNewMarkerResult,
  BlockTokenizerEatingInfo,
  BlockTokenizerLazyContinuationResult,
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerParsePhaseHook,
  BlockTokenizerParsePhaseState,
  BlockTokenizerPreMatchPhaseHook,
  BlockTokenizerPreMatchPhaseState,
  BlockTokenizerPreParsePhaseState,
  FallbackBlockTokenizer,
  PhrasingContentDataNode,
  PhrasingContentDataNodeType,
  PhrasingContentLine,
  PhrasingContentMatchPhaseState,
} from '@yozora/tokenizercore-block'
import {
  ParagraphDataNode,
  ParagraphDataNodeType,
  ParagraphMatchPhaseState,
  ParagraphPreMatchPhaseState,
} from './types/paragraph'
import { mergeContentLines } from './util'


type T = ParagraphDataNodeType | PhrasingContentDataNodeType



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
    BlockTokenizerPreMatchPhaseHook<
      T,
      ParagraphPreMatchPhaseState>,
    BlockTokenizerMatchPhaseHook<
      T,
      ParagraphPreMatchPhaseState,
      ParagraphMatchPhaseState>,
    BlockTokenizerParsePhaseHook<
      T,
      ParagraphMatchPhaseState,
      ParagraphDataNode | PhrasingContentDataNode>,
    FallbackBlockTokenizer
{
  public readonly name = 'ParagraphTokenizer'
  public readonly uniqueTypes: T[] = [
    ParagraphDataNodeType,
    PhrasingContentDataNodeType
  ]

  /**
   * hook of @BlockTokenizerPreMatchPhaseHook
   */
  public eatNewMarker(
    codePositions: DataNodeTokenPointDetail[],
    eatingInfo: BlockTokenizerEatingInfo,
    parentState: Readonly<BlockTokenizerPreMatchPhaseState>,
  ): BlockTokenizerEatNewMarkerResult<T, ParagraphPreMatchPhaseState> {
    if (eatingInfo.isBlankLine) return null
    const { startIndex, endIndex, firstNonWhiteSpaceIndex } = eatingInfo
    const line: PhrasingContentLine = {
      codePositions: codePositions.slice(startIndex, endIndex),
      firstNonWhiteSpaceIndex: firstNonWhiteSpaceIndex - startIndex,
    }
    const state: ParagraphPreMatchPhaseState = {
      type: ParagraphDataNodeType,
      opening: true,
      parent: parentState,
      lines: [line],
    }
    return { nextIndex: endIndex, state }
  }

  /**
   * hook of @BlockTokenizerPreMatchPhaseHook
   */
  public eatContinuationText(
    codePositions: DataNodeTokenPointDetail[],
    eatingInfo: BlockTokenizerEatingInfo,
    state: ParagraphPreMatchPhaseState,
  ): BlockTokenizerEatContinuationResult {
    /**
     * Paragraphs can contain multiple lines, but no blank lines
     * @see https://github.github.com/gfm/#example-190
     */
    if (eatingInfo.isBlankLine) return null
    const { startIndex, endIndex, firstNonWhiteSpaceIndex } = eatingInfo

    const line: PhrasingContentLine = {
      codePositions: codePositions.slice(startIndex, endIndex),
      firstNonWhiteSpaceIndex: firstNonWhiteSpaceIndex - startIndex,
    }
    state.lines.push(line)
    return { resultType: 'continue', nextIndex: endIndex, saturated: false }
  }

  /**
   * hook of @BlockTokenizerPreMatchPhaseHook
   */
  public eatLazyContinuationText(
    codePositions: DataNodeTokenPointDetail[],
    eatingInfo: BlockTokenizerEatingInfo,
    state: ParagraphPreMatchPhaseState,
  ): BlockTokenizerLazyContinuationResult {
    const result = this.eatContinuationText(codePositions, eatingInfo, state)
    if (result == null || result.resultType !== 'continue') return null
    return {
      nextIndex: result.nextIndex,
      saturated: result.saturated,
    }
  }

  /**
   * hook of @BlockTokenizerMatchPhaseHook
   */
  public match(
    preMatchPhaseState: ParagraphPreMatchPhaseState,
  ): ParagraphMatchPhaseState {
    const phrasingContent: PhrasingContentMatchPhaseState = {
      type: PhrasingContentDataNodeType,
      classify: 'flow',
      lines: preMatchPhaseState.lines,
    }
    const result: ParagraphMatchPhaseState = {
      type: ParagraphDataNodeType,
      classify: 'flow',
      children: [phrasingContent],
    }
    return result
  }

  /**
   * hook of @BlockTokenizerParsePhaseHook
   */
  public parseFlow(
    matchPhaseState: ParagraphMatchPhaseState | PhrasingContentMatchPhaseState,
    preParsePhaseState: BlockTokenizerPreParsePhaseState,
    children?: BlockTokenizerParsePhaseState[],
  ): ParagraphDataNode | PhrasingContentDataNode | null {
    switch (matchPhaseState.type) {
      case ParagraphDataNodeType: {
        // A paragraph has at least one PhrasingContent child
        if (children == null || children.length <= 0) return null
        const result: ParagraphDataNode = {
          type: ParagraphDataNodeType,
          children: children as [PhrasingContentDataNode],
        }
        return result
      }
      case PhrasingContentDataNodeType: {
        const contents = mergeContentLines(matchPhaseState.lines)
        if (contents.length <= 0) return null
        const result: PhrasingContentDataNode = {
          type: matchPhaseState.type,
          contents,
        }
        return result
      }
    }
  }

  /**
   * override from @FallbackBlockTokenizer
   */
  public createPreMatchPhaseState(
    opening: boolean,
    parent: BlockTokenizerPreMatchPhaseState,
    lines: PhrasingContentLine[],
  ): ParagraphPreMatchPhaseState {
    return {
      type: ParagraphDataNodeType,
      opening,
      parent,
      lines,
    }
  }
}
