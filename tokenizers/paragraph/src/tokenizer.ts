import type { NodePoint } from '@yozora/character'
import type { YastNodeType } from '@yozora/tokenizercore'
import type {
  BlockTokenizer,
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerParsePhaseHook,
  EatingLineInfo,
  FallbackBlockTokenizer,
  PhrasingContent,
  PhrasingContentLine,
  PhrasingContentPostMatchPhaseState,
  ResultOfEatContinuationText,
  ResultOfEatLazyContinuationText,
  ResultOfEatOpener,
  ResultOfParse,
} from '@yozora/tokenizercore-block'
import type {
  Paragraph as Node,
  ParagraphMatchPhaseState as MS,
  ParagraphPostMatchPhaseState as PMS,
  ParagraphType as T,
} from './types'
import {
  PhrasingContentType,
  calcPositionFromPhrasingContentLines,
  mergeContentLinesAndStrippedLines,
} from '@yozora/tokenizercore-block'
import { ParagraphType } from './types'


/**
 * Params for constructing ParagraphTokenizer
 */
export interface ParagraphTokenizerProps {
  /**
   * YastNode types that can be interrupt by this BlockTokenizer.
   */
  readonly interruptableTypes?: YastNodeType[]
}


/**
 * Lexical Analyzer for Paragraph
 *
 * A sequence of non-blank lines that cannot be interpreted as other kinds
 * of blocks forms a paragraph. The contents of the paragraph are the result
 * of parsing the paragraph’s raw content as inlines. The paragraph’s raw
 * content is formed by concatenating the lines and removing initial and
 * final whitespace.
 * @see https://github.github.com/gfm/#paragraphs
 */
export class ParagraphTokenizer implements
  BlockTokenizer<T, MS, PMS>,
  FallbackBlockTokenizer<T, MS, PMS, Node>,
  BlockTokenizerMatchPhaseHook<T, MS>,
  BlockTokenizerParsePhaseHook<T, PMS, Node>
{
  public readonly name = 'ParagraphTokenizer'
  public readonly getContext: BlockTokenizer['getContext'] = () => null

  public readonly isContainerBlock = false
  public readonly interruptableTypes: ReadonlyArray<YastNodeType>
  public readonly recognizedTypes: ReadonlyArray<T> = [ParagraphType]

  public constructor(props: ParagraphTokenizerProps = {}) {
    this.interruptableTypes = Array.isArray(props.interruptableTypes)
      ? [...props.interruptableTypes]
      : []
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
      firstNonWhitespaceIndex: firstNonWhitespaceIndex,
    }
    const state: MS = {
      type: ParagraphType,
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
     * Paragraphs can contain multiple lines, but no blank lines
     * @see https://github.github.com/gfm/#example-190
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
    // Try to build phrasingContent
    const phrasingContentState: PhrasingContentPostMatchPhaseState = {
      type: PhrasingContentType,
      lines: state.lines,
      position: state.position,
    }
    const phrasingContent = this.buildPhrasingContent(phrasingContentState)
    if (phrasingContent == null) return null

    const node: Node = { type: ParagraphType, children: [phrasingContent] }
    return { classification: 'flow', node }
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
      type: ParagraphType,
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
