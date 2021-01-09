import type { EnhancedYastNodePoint } from '@yozora/tokenizercore'
import type {
  BlockTokenizer,
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseHook,
  BlockTokenizerProps,
  EatingLineInfo,
  PhrasingContent,
  PhrasingContentLine,
  PhrasingContentMatchPhaseState,
  PhrasingContentMatchPhaseStateData,
  ResultOfEatContinuationText,
  ResultOfEatLazyContinuationText,
  ResultOfEatOpener,
  ResultOfParse,
} from '@yozora/tokenizercore-block'
import type {
  ClosedParagraphMatchPhaseState as CMS,
  Paragraph as PS,
  ParagraphMatchPhaseState as MS,
  ParagraphMatchPhaseStateData as MSD,
  ParagraphType as T,
} from './types'
import {
  PhrasingContentType,
  mergeContentLines,
} from '@yozora/tokenizercore-block'
import { BaseBlockTokenizer } from '@yozora/tokenizercore-block'
import { ParagraphType } from './types'


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
export class ParagraphTokenizer extends BaseBlockTokenizer<T> implements
  BlockTokenizer<T>,
  BlockTokenizerMatchPhaseHook<T, MSD>,
  BlockTokenizerParsePhaseHook<T, MSD, PS>
{
  public readonly name = 'ParagraphTokenizer'
  public readonly uniqueTypes: T[] = [ParagraphType]

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
      type: ParagraphType,
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
     * Paragraphs can contain multiple lines, but no blank lines
     * @see https://github.github.com/gfm/#example-190
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
    return {
      type: PhrasingContentType,
      opening: state.opening,
      saturated: state.saturated,
      parent: state.parent,
      lines: state.lines,
    }
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
    phrasingContentStateData: PhrasingContentMatchPhaseStateData
  ): CMS | null {
    const lines = phrasingContentStateData.lines
      .filter(line => line.nodePoints.length > 0)
    if (lines.length <= 0) return null
    return {
      type: ParagraphType,
      lines,
      children: originalClosedMatchState.children,
    }
  }

  /**
   * @override
   * @see BlockTokenizerParsePhaseHook#parse
   */
  public parse(matchPhaseStateData: MSD): ResultOfParse<T, PS> {
    const state: PS = {
      type: ParagraphType,
      children: [],
    }

    const contents = mergeContentLines(matchPhaseStateData.lines)
    if (contents.length > 0) {
      const phrasingContent: PhrasingContent = {
        type: PhrasingContentType,
        contents,
      }
      state.children.push(phrasingContent)
    }

    return { classification: 'flow', state }
  }
}
