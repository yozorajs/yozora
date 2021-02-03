import type { EnhancedYastNodePoint } from '@yozora/tokenizercore'
import type { YastBlockNodeType } from './types/node'
import type {
  BlockTokenizer,
  EatingLineInfo,
  FallbackBlockTokenizer,
  PhrasingContent,
  PhrasingContent as PS,
  PhrasingContentLine,
  PhrasingContentMatchPhaseState as MS,
  PhrasingContentPostMatchPhaseState,
  PhrasingContentPostMatchPhaseState as PMS,
  PhrasingContentType as T,
  ResultOfEatContinuationText,
  ResultOfEatLazyContinuationText,
  ResultOfEatOpener,
  ResultOfParse,
} from './types/tokenizer'
import { PhrasingContentType } from './types/tokenizer'
import {
  calcPositionFromPhrasingContentLines,
  mergeContentLinesAndStrippedLines,
} from './util'


/**
 * Params for constructing PhrasingContentTokenizer
 */
export interface PhrasingContentTokenizerProps {
  /**
   * YastNode types that can be interrupt by this BlockTokenizer.
   */
  readonly interruptableTypes?: YastBlockNodeType[]
}


/**
 * Lexical Analyzer for PhrasingContent
 */
export class PhrasingContentTokenizer
  implements FallbackBlockTokenizer<T, MS, PMS, PS> {
  public readonly name = 'PhrasingContentTokenizer'
  public readonly getContext: BlockTokenizer['getContext'] = () => null

  public readonly isContainerBlock = false
  public readonly recognizedTypes: ReadonlyArray<T> = [PhrasingContentType]
  public readonly interruptableTypes: ReadonlyArray<YastBlockNodeType>

  public constructor(props: PhrasingContentTokenizerProps = {}) {
    this.interruptableTypes = Array.isArray(props.interruptableTypes)
      ? [...props.interruptableTypes]
      : [PhrasingContentType]
  }

  /**
   * @override
   * @see BlockTokenizerMatchPhaseHook
   */
  public eatOpener(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    eatingInfo: EatingLineInfo,
  ): ResultOfEatOpener<T, MS> {
    const { startIndex, endIndex, firstNonWhitespaceIndex } = eatingInfo
    if (firstNonWhitespaceIndex >= endIndex) return null

    const line: PhrasingContentLine = {
      nodePoints,
      startIndex,
      endIndex,
      firstNonWhitespaceIndex,
    }
    const state: MS = {
      type: PhrasingContentType,
      lines: [line],
    }
    return { state, nextIndex: endIndex }
  }

  /**
   * @override
   * @see BlockTokenizerMatchPhaseHook
   */
  public eatContinuationText(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    eatingInfo: EatingLineInfo,
    state: MS,
  ): ResultOfEatContinuationText {
    const { startIndex, endIndex, firstNonWhitespaceIndex } = eatingInfo

    /**
     * PhrasingContent can contain multiple lines, but no blank lines
     */
    if (firstNonWhitespaceIndex >= endIndex) {
      return { status: 'notMatched' }
    }

    const line: PhrasingContentLine = {
      nodePoints,
      startIndex,
      endIndex,
      firstNonWhitespaceIndex,
    }
    state.lines.push(line)
    return { status: 'opening', nextIndex: endIndex }
  }

  /**
   * @override
   * @see BlockTokenizerMatchPhaseHook
   */
  public eatLazyContinuationText(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    eatingInfo: EatingLineInfo,
    state: MS,
  ): ResultOfEatLazyContinuationText {
    const result = this.eatContinuationText(nodePoints, eatingInfo, state)
    return result as ResultOfEatLazyContinuationText
  }

  /**
   * @override
   * @see BlockTokenizerParsePhaseHook
   */
  public parse(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    postMatchState: Readonly<PMS>,
  ): ResultOfParse<T, PS> {
    const state: PS | null = this.buildPhrasingContent(postMatchState)
    if (state == null) return null
    return { classification: 'flow', state }
  }

  /**
   * @override
   * @see BlockTokenizer
   */
  public extractPhrasingContentLines(
    state: Readonly<MS>,
  ): ReadonlyArray<PhrasingContentLine> {
    return state.lines
  }

  /**
   * @override
   * @see BlockTokenizer
   */
  public buildPostMatchPhaseState(
    originalState: PMS,
    _lines: ReadonlyArray<PhrasingContentLine>,
  ): PMS | null {
    const lines = _lines.filter(line => line.startIndex < line.endIndex)
    if (lines.length <= 0) return null

    const position = calcPositionFromPhrasingContentLines(lines)
    if (position == null) return null

    return {
      type: PhrasingContentType,
      lines,
      position,
    }
  }

  /**
   * @override
   * @see FallbackBlockTokenizer
   */
  public buildPhrasingContent(
    state: Readonly<PhrasingContentPostMatchPhaseState>,
  ): PhrasingContent | null {
    const contents = mergeContentLinesAndStrippedLines(state.lines)
    if (contents.length <= 0) return null

    const phrasingContent: PhrasingContent = {
      type: PhrasingContentType,
      contents,
    }
    return phrasingContent
  }
}
