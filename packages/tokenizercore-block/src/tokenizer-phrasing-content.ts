import type { EnhancedYastNodePoint } from '@yozora/tokenizercore'
import type {
  BlockTokenizerProps,
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
import { BaseBlockTokenizer } from './tokenizer'
import { PhrasingContentType } from './types/tokenizer'
import {
  calcPositionFromPhrasingContentLines,
  mergeContentLines,
} from './util'


/**
 * Lexical Analyzer for PhrasingContent
 */
export class PhrasingContentTokenizer extends BaseBlockTokenizer<T, MS, PMS>
  implements FallbackBlockTokenizer<T, MS, PMS, PS> {
  public readonly name = 'PhrasingContentTokenizer'
  public readonly uniqueTypes: T[] = [PhrasingContentType]

  public constructor(props: BlockTokenizerProps = {}) {
    super({
      ...props,
      interruptableTypes: props.interruptableTypes || [],
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
    if (eatingInfo.isBlankLine) return null

    const { startIndex, endIndex, firstNonWhiteSpaceIndex } = eatingInfo
    const line: PhrasingContentLine = {
      nodePoints: nodePoints.slice(startIndex, endIndex),
      firstNonWhiteSpaceIndex: firstNonWhiteSpaceIndex - startIndex,
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
    const { startIndex, isBlankLine } = eatingInfo

    /**
     * PhrasingContent can contain multiple lines, but no blank lines
     */
    if (isBlankLine) {
      return { nextIndex: null, saturated: true }
    }

    const { endIndex, firstNonWhiteSpaceIndex } = eatingInfo
    const line: PhrasingContentLine = {
      nodePoints: nodePoints.slice(startIndex, endIndex),
      firstNonWhiteSpaceIndex: firstNonWhiteSpaceIndex - startIndex,
    }
    state.lines.push(line)
    return { nextIndex: endIndex }
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
    const { nextIndex, saturated } = result
    return { nextIndex, saturated } as ResultOfEatLazyContinuationText
  }

  /**
   * @override
   * @see BlockTokenizerParsePhaseHook
   */
  public parse(postMatchState: Readonly<PMS>): ResultOfParse<T, PS> {
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
  public buildMatchPhaseState(
    originalState: MS,
    lines: ReadonlyArray<PhrasingContentLine>,
  ): MS | null {
    return this.buildMatchPhaseStateFromPhrasingContentLine(lines)
  }

  /**
   * @override
   * @see BlockTokenizer
   */
  public buildPostMatchPhaseState(
    originalState: PMS,
    _lines: ReadonlyArray<PhrasingContentLine>,
  ): PMS | null {
    const lines = _lines.filter(line => line.nodePoints.length > 0)
    if (lines.length <= 0) return null

    const position = calcPositionFromPhrasingContentLines(lines)
    if (position == null) return null

    return { ...originalState, lines, position }
  }

  /**
   * @override
   * @see FallbackBlockTokenizer
   */
  public buildPhrasingContent(
    state: Readonly<PhrasingContentPostMatchPhaseState>,
  ): PhrasingContent | null {
    const contents = mergeContentLines(state.lines)
    if (contents.length <= 0) return null

    const phrasingContent: PhrasingContent = {
      type: PhrasingContentType,
      contents,
    }
    return phrasingContent
  }

  /**
   * @override
   * @see FallbackBlockTokenizer
   */
  public buildMatchPhaseStateFromPhrasingContentLine(
    lines: ReadonlyArray<PhrasingContentLine>,
  ): MS | null {
    if (lines.length <= 0) return null
    return { type: PhrasingContentType, lines: [...lines] }
  }
}
