import type { EnhancedYastNodePoint } from '@yozora/tokenizercore'
import type {
  BlockTokenizerMatchPhaseState,
  EatingLineInfo,
  ResultOfEatContinuationText,
  ResultOfEatLazyContinuationText,
  ResultOfEatOpener,
} from './types/lifecycle/match'
import type { ResultOfParse } from './types/lifecycle/parse'
import type {
  ClosedPhrasingContentMatchPhaseState as CMS,
  PhrasingContent as PS,
  PhrasingContentMatchPhaseState,
  PhrasingContentMatchPhaseState as MS,
  PhrasingContentMatchPhaseStateData,
  PhrasingContentMatchPhaseStateData as MSD,
  PhrasingContentType as T,
} from './types/phrasing-content'
import type { PhrasingContentLine } from './types/phrasing-content'
import type {
  BlockTokenizerProps,
  FallbackBlockTokenizer,
} from './types/tokenizer'
import {
  BaseBlockTokenizer,
  mergeContentLines,
} from '@yozora/tokenizercore-block'
import { PhrasingContentType } from './types/phrasing-content'


/**
 * Lexical Analyzer for PhrasingContent
 */
export class PhrasingContentTokenizer extends BaseBlockTokenizer<T>
  implements FallbackBlockTokenizer<T, MSD, PS> {
  public readonly name = 'PhrasingContentTokenizer'
  public readonly uniqueTypes: T[] = [PhrasingContentType]

  public constructor(props: BlockTokenizerProps) {
    super({
      ...props,
      interruptableTypes: props.interruptableTypes || [],
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
    if (eatingInfo.isBlankLine) return null

    const { startIndex, endIndex, firstNonWhiteSpaceIndex } = eatingInfo
    const line: PhrasingContentLine = {
      nodePoints: nodePoints.slice(startIndex, endIndex),
      firstNonWhiteSpaceIndex: firstNonWhiteSpaceIndex - startIndex,
    }
    const state: MS = {
      type: PhrasingContentType,
      opening: true,
      saturated: false,
      parent: parentState,
      lines: [line],
    }
    return { state, nextIndex: endIndex }
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
   * @override
   * @see BlockTokenizerMatchPhaseHook#eatLazyContinuationText
   */
  public eatLazyContinuationText(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    eatingInfo: EatingLineInfo,
    state: MS,
  ): ResultOfEatLazyContinuationText<T, MSD> {
    const result = this.eatContinuationText(nodePoints, eatingInfo, state)
    if (result == null || result.finished) return null
    return result
  }

  /**
   * @override
   * @see BlockTokenizerMatchPhaseHook#extractPhrasingContentMS
   */
  public extractPhrasingContentMS(
    state: Readonly<MS>,
  ): PhrasingContentMatchPhaseState | null {
    return { ...state }
  }

  /**
   * @override
   * @see BlockTokenizerMatchPhaseHook#extractPhrasingContentCMS
   */
  public extractPhrasingContentCMS(
    closedMatchPhaseState: Readonly<CMS>,
  ): PhrasingContentMatchPhaseStateData | null {
    return {
      type: PhrasingContentType,
      lines: closedMatchPhaseState.lines,
    }
  }

  /**
   * @override
   * @see BlockTokenizerMatchPhaseHook#buildCMSFromPhrasingContentData
   */
  public buildCMSFromPhrasingContentData(
    originalClosedMatchState: CMS,
    phrasingContentStateData: PhrasingContentMatchPhaseStateData,
  ): CMS | null {
    const lines = phrasingContentStateData.lines
      .filter(line => line.nodePoints.length > 0)
    if (lines.length <= 0) return null
    return {
      type: PhrasingContentType,
      lines,
      children: originalClosedMatchState.children,
    }
  }

  /**
   * @override
   * @see BlockTokenizerParsePhaseHook#parse
   */
  public parse(
    matchPhaseStateData: MSD,
  ): ResultOfParse<T, PS> {
    const contents = mergeContentLines(matchPhaseStateData.lines)
    if (contents.length <= 0) return null

    const state: PS = {
      type: PhrasingContentType,
      contents,
    }
    return { classification: 'flow', state }
  }

  /**
   * @override
   * @see FallbackBlockTokenizer#buildPhrasingContentMatchPhaseState
   */
  public buildPhrasingContentMatchPhaseState(
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
