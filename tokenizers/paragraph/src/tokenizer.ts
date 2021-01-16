import type { EnhancedYastNodePoint } from '@yozora/tokenizercore'
import type {
  BlockTokenizer,
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerParsePhaseHook,
  BlockTokenizerProps,
  EatingLineInfo,
  PhrasingContentLine,
  PhrasingContentPostMatchPhaseState,
  ResultOfEatContinuationText,
  ResultOfEatLazyContinuationText,
  ResultOfEatOpener,
  ResultOfParse,
} from '@yozora/tokenizercore-block'
import type {
  Paragraph as PS,
  ParagraphMatchPhaseState as MS,
  ParagraphPostMatchPhaseState as PMS,
  ParagraphType as T,
} from './types'
import {
  PhrasingContent,
  PhrasingContentType,
  calcPositionFromPhrasingContentLines,
  mergeContentLines,
} from '@yozora/tokenizercore-block'
import { BaseBlockTokenizer } from '@yozora/tokenizercore-block'
import { ParagraphType } from './types'


/**
 * Params for constructing ParagraphTokenizer
 */
export interface ParagraphTokenizerProps extends BlockTokenizerProps {

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
export class ParagraphTokenizer extends BaseBlockTokenizer<T, MS, PMS> implements
  BlockTokenizer<T, MS, PMS>,
  BlockTokenizerMatchPhaseHook<T, MS>,
  BlockTokenizerParsePhaseHook<T, PMS, PS>
{
  public readonly name = 'ParagraphTokenizer'
  public readonly uniqueTypes: T[] = [ParagraphType]

  public constructor(props: ParagraphTokenizerProps = {}) {
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
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    eatingInfo: EatingLineInfo,
    state: MS,
  ): ResultOfEatContinuationText {
    const { startIndex, isBlankLine } = eatingInfo

    /**
     * Paragraphs can contain multiple lines, but no blank lines
     * @see https://github.github.com/gfm/#example-190
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
    const context = this.getContext()
    if (context == null) return null

    // Try to build phrasingContent
    const phrasingContent = context
      .buildPhrasingContentParsePhaseState(postMatchState.lines)
    if (phrasingContent == null) return null

    const state: PS = {
      type: ParagraphType,
      children: [phrasingContent],
    }
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
    return { type: ParagraphType, lines: [...lines] }
  }
}
