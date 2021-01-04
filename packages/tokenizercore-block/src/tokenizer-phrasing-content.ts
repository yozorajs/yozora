import type { YastNodePoint } from '@yozora/tokenizercore'
import type {
  BlockTokenizerMatchPhaseState,
  EatingLineInfo,
  ResultOfEatContinuationText,
  ResultOfEatLazyContinuationText,
  ResultOfEatOpener,
} from './types/lifecycle/match'
import type { ResultOfParse } from './types/lifecycle/parse'
import type {
  PhrasingContent,
  PhrasingContentMatchPhaseState,
  PhrasingContentType as T,
} from './types/phrasing-content'
import type { PhrasingContentLine } from './types/phrasing-content'
import type { FallbackBlockTokenizer } from './types/tokenizer'
import {
  BaseBlockTokenizer,
  mergeContentLines,
} from '@yozora/tokenizercore-block'
import { PhrasingContentType } from './types/phrasing-content'


/**
 * Lexical Analyzer for PhrasingContent
 */
export class PhrasingContentTokenizer extends BaseBlockTokenizer<T>
  implements FallbackBlockTokenizer<T, PhrasingContentMatchPhaseState, PhrasingContent> {

  public readonly name = 'PhrasingContentTokenizer'
  public readonly uniqueTypes: T[] = [PhrasingContentType]

  /**
   * hook of @BlockTokenizerMatchPhaseHook
   */
  public eatOpener(
    nodePoints: YastNodePoint[],
    eatingInfo: EatingLineInfo,
    parentState: Readonly<BlockTokenizerMatchPhaseState>,
  ): ResultOfEatOpener<T, PhrasingContentMatchPhaseState> {
    if (eatingInfo.isBlankLine) return null

    const { startIndex, endIndex, firstNonWhiteSpaceIndex } = eatingInfo
    const line: PhrasingContentLine = {
      nodePoints: nodePoints.slice(startIndex, endIndex),
      firstNonWhiteSpaceIndex: firstNonWhiteSpaceIndex - startIndex,
    }
    const state: PhrasingContentMatchPhaseState = {
      type: PhrasingContentType,
      opening: true,
      saturated: false,
      parent: parentState,
      lines: [line],
    }
    return { nextIndex: endIndex, state }
  }

  /**
   * hook of @BlockTokenizerMatchPhaseHook
   */
  public eatContinuationText(
    nodePoints: YastNodePoint[],
    eatingInfo: EatingLineInfo,
    state: PhrasingContentMatchPhaseState,
  ): ResultOfEatContinuationText<T, PhrasingContentMatchPhaseState> {
    /**
     * PhrasingContent can contain multiple lines, but no blank lines
     */
    if (eatingInfo.isBlankLine) return null
    const { startIndex, endIndex, firstNonWhiteSpaceIndex } = eatingInfo

    const line: PhrasingContentLine = {
      nodePoints: nodePoints.slice(startIndex, endIndex),
      firstNonWhiteSpaceIndex: firstNonWhiteSpaceIndex - startIndex,
    }
    state.lines.push(line)
    return { state, nextIndex: endIndex }
  }

  /**
   * hook of @BlockTokenizerMatchPhaseHook
   */
  public eatLazyContinuationText(
    nodePoints: YastNodePoint[],
    eatingInfo: EatingLineInfo,
    state: PhrasingContentMatchPhaseState,
  ): ResultOfEatLazyContinuationText<T, PhrasingContentMatchPhaseState> {
    const result = this.eatContinuationText(nodePoints, eatingInfo, state)
    if (result == null || result.finished) return null
    return { state, nextIndex: result.nextIndex }
  }

  /**
   * hook of @BlockTokenizerParsePhaseHook
   */
  public parse(
    matchPhaseState: PhrasingContentMatchPhaseState,
  ): ResultOfParse<T, PhrasingContent> {
    const contents = mergeContentLines(matchPhaseState.lines)
    if (contents.length <= 0) return null

    const state: PhrasingContent = {
      type: PhrasingContentType,
      contents,
    }
    return { classification: 'flow', state }
  }

  /**
   * override from @FallbackBlockTokenizer
   */
  public createMatchPhaseState(
    opening: boolean,
    parent: BlockTokenizerMatchPhaseState,
    lines: PhrasingContentLine[],
  ): PhrasingContentMatchPhaseState {
    return {
      type: PhrasingContentType,
      opening,
      saturated: !opening,
      parent,
      lines,
    }
  }
}
