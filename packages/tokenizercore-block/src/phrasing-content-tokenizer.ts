import type { NodePoint } from '@yozora/character'
import type { YastNodeType } from '@yozora/tokenizercore'
import type {
  EatingLineInfo,
  ResultOfEatContinuationText,
  ResultOfEatLazyContinuationText,
  ResultOfEatOpener,
} from './types/lifecycle/match'
import type { ResultOfParse } from './types/lifecycle/parse'
import type {
  PhrasingContent,
  PhrasingContent as Node,
  PhrasingContentLine,
  PhrasingContentMatchPhaseState as MS,
  PhrasingContentPostMatchPhaseState,
  PhrasingContentPostMatchPhaseState as PMS,
  PhrasingContentType as T,
} from './types/phrasing-content'
import type { BlockTokenizer, FallbackBlockTokenizer } from './types/tokenizer'
import { PhrasingContentType } from './types/phrasing-content'
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
  readonly interruptableTypes?: YastNodeType[]
}


/**
 * Lexical Analyzer for PhrasingContent
 */
export class PhrasingContentTokenizer
  implements FallbackBlockTokenizer<T, MS, PMS, Node> {
  public readonly name = 'PhrasingContentTokenizer'
  public readonly getContext: BlockTokenizer['getContext'] = () => null

  public readonly isContainerBlock = false
  public readonly interruptableTypes: ReadonlyArray<YastNodeType>
  public readonly recognizedTypes: ReadonlyArray<T> = [PhrasingContentType]

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
    nodePoints: ReadonlyArray<NodePoint>,
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
    nodePoints: ReadonlyArray<NodePoint>,
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
    nodePoints: ReadonlyArray<NodePoint>,
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
  public parse(state: Readonly<PMS>): ResultOfParse<T, Node> {
    const node: Node | null = this.buildPhrasingContent(state)
    if (node == null) return null
    return { classification: 'flow', node: node }
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

    const phrasingContent: PhrasingContent = { type: PhrasingContentType, contents }
    return phrasingContent
  }
}
