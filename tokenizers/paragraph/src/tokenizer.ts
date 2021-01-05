import type { YastNodePoint } from '@yozora/tokenizercore'
import type {
  BlockTokenizer,
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseHook,
  EatingLineInfo,
  PhrasingContent,
  PhrasingContentLine,
  PhrasingContentMatchPhaseState,
  ResultOfEatContinuationText,
  ResultOfEatLazyContinuationText,
  ResultOfEatOpener,
  ResultOfParse,
  YastBlockNodeType,
} from '@yozora/tokenizercore-block'
import type {
  Paragraph,
  ParagraphMatchPhaseState,
  ParagraphMatchPhaseStateData,
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
  BlockTokenizerMatchPhaseHook<T, ParagraphMatchPhaseStateData>,
  BlockTokenizerParsePhaseHook<T, ParagraphMatchPhaseStateData, Paragraph>
{
  public readonly name = 'ParagraphTokenizer'
  public readonly uniqueTypes: T[] = [ParagraphType]
  public readonly interruptableTypes: YastBlockNodeType[] = []

  /**
   * hook of @BlockTokenizerMatchPhaseHook
   */
  public eatOpener(
    nodePoints: YastNodePoint[],
    eatingInfo: EatingLineInfo,
    parentState: Readonly<BlockTokenizerMatchPhaseState>,
  ): ResultOfEatOpener<T, ParagraphMatchPhaseStateData> {
    if (eatingInfo.isBlankLine) return null

    const { startIndex, endIndex, firstNonWhiteSpaceIndex } = eatingInfo
    const line: PhrasingContentLine = {
      nodePoints: nodePoints.slice(startIndex, endIndex),
      firstNonWhiteSpaceIndex: firstNonWhiteSpaceIndex - startIndex,
    }
    const state: ParagraphMatchPhaseState = {
      type: ParagraphType,
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
  public couldInterruptPreviousSibling(
    type: YastBlockNodeType,
    priority: number,
  ): boolean {
    if (this.priority < priority) return false
    return this.interruptableTypes.includes(type)
  }

  /**
   * hook of @BlockTokenizerMatchPhaseHook
   */
  public eatContinuationText(
    nodePoints: YastNodePoint[],
    eatingInfo: EatingLineInfo,
    state: ParagraphMatchPhaseState,
  ): ResultOfEatContinuationText<T, ParagraphMatchPhaseStateData> {
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
   * hook of @BlockTokenizerMatchPhaseHook
   */
  public eatLazyContinuationText(
    nodePoints: YastNodePoint[],
    eatingInfo: EatingLineInfo,
    state: ParagraphMatchPhaseState,
  ): ResultOfEatLazyContinuationText<T, ParagraphMatchPhaseStateData> {
    const result = this.eatContinuationText(nodePoints, eatingInfo, state)
    if (result == null || result.finished) return null
    return { state, nextIndex: result.nextIndex }
  }

  /**
   * hook of @BlockTokenizerMatchPhaseHook
   */
  public extractPhrasingContentMatchPhaseState(
    state: Readonly<ParagraphMatchPhaseState>,
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
   * hook of @BlockTokenizerParsePhaseHook
   */
  public parse(
    matchPhaseStateData: ParagraphMatchPhaseStateData,
  ): ResultOfParse<T, Paragraph> {
    const state: Paragraph = {
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
