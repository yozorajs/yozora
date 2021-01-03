import type { YastNodePoint } from '@yozora/tokenizercore'
import type {
  BlockTokenizer,
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerParsePhaseHook,
  BlockTokenizerParsePhaseState,
  BlockTokenizerPreMatchPhaseHook,
  BlockTokenizerPreMatchPhaseState,
  BlockTokenizerPreParsePhaseState,
  EatContinuationTextResult,
  EatLazyContinuationTextResult,
  EatNewMarkerResult,
  EatingLineInfo,
  FallbackBlockTokenizer,
  PhrasingContentDataNode,
  PhrasingContentLine,
  PhrasingContentMatchPhaseState,
} from '@yozora/tokenizercore-block'
import type {
  Paragraph,
  ParagraphMatchPhaseState,
  ParagraphPreMatchPhaseState,
} from './types'
import {
  BaseBlockTokenizer,
  PhrasingContentDataNodeType,
} from '@yozora/tokenizercore-block'
import { ParagraphType } from './types'
import { mergeContentLines } from './util'


type T = ParagraphType | PhrasingContentDataNodeType



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
      Paragraph | PhrasingContentDataNode>,
    FallbackBlockTokenizer
{
  public readonly name = 'ParagraphTokenizer'
  public readonly uniqueTypes: T[] = [
    ParagraphType,
    PhrasingContentDataNodeType
  ]

  /**
   * hook of @BlockTokenizerPreMatchPhaseHook
   */
  public eatNewMarker(
    nodePoints: YastNodePoint[],
    eatingInfo: EatingLineInfo,
    parentState: Readonly<BlockTokenizerPreMatchPhaseState>,
  ): EatNewMarkerResult<T, ParagraphPreMatchPhaseState> {
    if (eatingInfo.isBlankLine) return null
    const { startIndex, endIndex, firstNonWhiteSpaceIndex } = eatingInfo
    const line: PhrasingContentLine = {
      nodePoints: nodePoints.slice(startIndex, endIndex),
      firstNonWhiteSpaceIndex: firstNonWhiteSpaceIndex - startIndex,
    }
    const state: ParagraphPreMatchPhaseState = {
      type: ParagraphType,
      opening: true,
      saturated: false,
      parent: parentState,
      lines: [line],
    }
    return { nextIndex: endIndex, state }
  }

  /**
   * hook of @BlockTokenizerPreMatchPhaseHook
   */
  public eatContinuationText(
    nodePoints: YastNodePoint[],
    eatingInfo: EatingLineInfo,
    state: ParagraphPreMatchPhaseState,
  ): EatContinuationTextResult<T, ParagraphPreMatchPhaseState> {
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
    return { resultType: 'continue', state, nextIndex: endIndex }
  }

  /**
   * hook of @BlockTokenizerPreMatchPhaseHook
   */
  public eatLazyContinuationText(
    nodePoints: YastNodePoint[],
    eatingInfo: EatingLineInfo,
    state: ParagraphPreMatchPhaseState,
  ): EatLazyContinuationTextResult<T, ParagraphPreMatchPhaseState> {
    const result = this.eatContinuationText(nodePoints, eatingInfo, state)
    if (result == null || result.resultType !== 'continue') return null
    return { state, nextIndex: result.nextIndex }
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
      type: ParagraphType,
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
  ): Paragraph | PhrasingContentDataNode | null {
    switch (matchPhaseState.type) {
      case ParagraphType: {
        // A paragraph has at least one PhrasingContent child
        if (children == null || children.length <= 0) return null
        const result: Paragraph = {
          type: ParagraphType,
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
      type: ParagraphType,
      opening,
      saturated: !opening,
      parent,
      lines,
    }
  }
}
