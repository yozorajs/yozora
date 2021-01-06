import type { YastNodePoint } from '@yozora/tokenizercore'
import type {
  BlockTokenizer,
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseHook,
  EatingLineInfo,
  ResultOfEatContinuationText,
  ResultOfEatOpener,
  ResultOfParse,
  YastBlockNodeType,
} from '@yozora/tokenizercore-block'
import type {
  IndentedCode as PS,
  IndentedCodeMatchPhaseState as MS,
  IndentedCodeMatchPhaseStateData as MSD,
  IndentedCodeType as T,
} from './types'
import { calcStringFromCodePoints } from '@yozora/tokenizercore'
import { BaseBlockTokenizer } from '@yozora/tokenizercore-block'
import { IndentedCodeType } from './types'


/**
 * Lexical Analyzer for IndentedCode
 *
 * An indented code block is composed of one or more indented chunks
 * separated by blank lines. An indented chunk is a sequence of non-blank
 * lines, each indented four or more spaces. The contents of the code block
 * are the literal contents of the lines, including trailing line endings,
 * minus four spaces of indentation.
 * @see https://github.github.com/gfm/#indented-code-block
 */
export class IndentedCodeTokenizer extends BaseBlockTokenizer<T> implements
  BlockTokenizer<T>,
  BlockTokenizerMatchPhaseHook<T, MSD>,
  BlockTokenizerParsePhaseHook<T, MSD, PS>
{
  public readonly name = 'IndentedCodeTokenizer'
  public readonly uniqueTypes: T[] = [IndentedCodeType]
  public readonly interruptableTypes: YastBlockNodeType[] = []

  /**
   * hook of @BlockTokenizerMatchPhaseHook
   */
  public eatOpener(
    nodePoints: YastNodePoint[],
    eatingInfo: EatingLineInfo,
    parentState: Readonly<BlockTokenizerMatchPhaseState>,
  ): ResultOfEatOpener<T, MSD> {
    const { startIndex, firstNonWhiteSpaceIndex, endIndex } = eatingInfo
    if (firstNonWhiteSpaceIndex - startIndex < 4) return null

    const state: MS = {
      type: IndentedCodeType,
      opening: true,
      saturated: false,
      parent: parentState,
      contents: nodePoints.slice(startIndex + 4, endIndex),
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
    state: MS,
  ): ResultOfEatContinuationText<T, MSD> {
    const { isBlankLine, startIndex, firstNonWhiteSpaceIndex, endIndex } = eatingInfo

    /**
     * Blank line is allowed
     * @see https://github.github.com/gfm/#example-81
     * @see https://github.github.com/gfm/#example-82
     */
    if (firstNonWhiteSpaceIndex - startIndex < 4) {
      if (!isBlankLine) return null
      state.contents.push(nodePoints[endIndex - 1])
    } else {
      for (let i = startIndex + 4; i < endIndex; ++i) {
        state.contents.push(nodePoints[i])
      }
    }
    return { state, nextIndex: endIndex }
  }

  /**
   * hook of @BlockTokenizerParsePhaseHook
   */
  public parse(matchPhaseStateData: MSD): ResultOfParse<T, PS> {
    /**
     * Blank lines preceding or following an indented code block are not included in it
     * @see https://github.github.com/gfm/#example-87
     */
    const value: string = calcStringFromCodePoints(matchPhaseStateData.contents)
      .replace(/^(?:[^\S\n]*\n)+/g, '')
      .replace(/(?:[^\S\n]*\n)+$/g, '')

    const state: PS = {
      type: matchPhaseStateData.type,
      value,
    }
    return { classification: 'flow', state }
  }
}
