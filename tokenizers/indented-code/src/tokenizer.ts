import type { EnhancedYastNodePoint } from '@yozora/tokenizercore'
import type {
  BlockTokenizer,
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerParsePhaseHook,
  BlockTokenizerProps,
  EatingLineInfo,
  ResultOfEatContinuationText,
  ResultOfEatOpener,
  ResultOfParse,
} from '@yozora/tokenizercore-block'
import type {
  IndentedCode as PS,
  IndentedCodeMatchPhaseState as MS,
  IndentedCodePostMatchPhaseState as PMS,
  IndentedCodeType as T,
} from './types'
import { calcStringFromNodePoints } from '@yozora/tokenizercore'
import { BaseBlockTokenizer } from '@yozora/tokenizercore-block'
import { IndentedCodeType } from './types'


/**
 * Params for constructing IndentedCodeTokenizer
 */
export interface IndentedCodeTokenizerProps extends BlockTokenizerProps {

}


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
export class IndentedCodeTokenizer extends BaseBlockTokenizer<T, MS, PMS> implements
  BlockTokenizer<T, MS, PMS>,
  BlockTokenizerMatchPhaseHook<T, MS>,
  BlockTokenizerParsePhaseHook<T, PMS, PS>
{
  public readonly name = 'IndentedCodeTokenizer'
  public readonly uniqueTypes: T[] = [IndentedCodeType]

  public constructor(props: IndentedCodeTokenizerProps = {}) {
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
    const { startIndex, firstNonWhiteSpaceIndex, endIndex } = eatingInfo
    if (firstNonWhiteSpaceIndex - startIndex < 4) return null

    const state: MS = {
      type: IndentedCodeType,
      contents: nodePoints.slice(startIndex + 4, endIndex),
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
    const { isBlankLine, startIndex, firstNonWhiteSpaceIndex, endIndex } = eatingInfo

    /**
     * Blank line is allowed
     * @see https://github.github.com/gfm/#example-81
     * @see https://github.github.com/gfm/#example-82
     */
    if (firstNonWhiteSpaceIndex - startIndex < 4) {
      if (!isBlankLine) {
        return { nextIndex: null, saturated: true }
      }
      state.contents.push(nodePoints[endIndex - 1])
    } else {
      for (let i = startIndex + 4; i < endIndex; ++i) {
        state.contents.push(nodePoints[i])
      }
    }
    return { nextIndex: endIndex }
  }

  /**
   * @override
   * @see BlockTokenizerParsePhaseHook
   */
  public parse(postMatchState: Readonly<PMS>): ResultOfParse<T, PS> {
    /**
     * Blank lines preceding or following an indented code block are not included in it
     * @see https://github.github.com/gfm/#example-87
     */
    const value: string = calcStringFromNodePoints(postMatchState.contents)
      .replace(/^(?:[^\S\n]*\n)+/g, '')
      .replace(/(?:[^\S\n]*\n)+$/g, '')

    const state: PS = {
      type: postMatchState.type,
      value,
    }
    return { classification: 'flow', state }
  }
}
