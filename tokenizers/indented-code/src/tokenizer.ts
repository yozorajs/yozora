import type { EnhancedYastNodePoint } from '@yozora/tokenizercore'
import type {
  BlockTokenizer,
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerParsePhaseHook,
  BlockTokenizerProps,
  EatingLineInfo,
  PhrasingContentLine,
  ResultOfEatContinuationText,
  ResultOfEatOpener,
  ResultOfParse,
  YastBlockNodeType,
} from '@yozora/tokenizercore-block'
import type {
  IndentedCode as PS,
  IndentedCodeMatchPhaseState as MS,
  IndentedCodePostMatchPhaseState as PMS,
  IndentedCodeType as T,
} from './types'
import { calcStringFromNodePoints } from '@yozora/tokenizercore'
import {
  BaseBlockTokenizer,
  mergeContentLinesFaithfully,
} from '@yozora/tokenizercore-block'
import { IndentedCodeType } from './types'


/**
 * Params for constructing IndentedCodeTokenizer
 */
export interface IndentedCodeTokenizerProps extends BlockTokenizerProps {
  /**
   * YastNode types that can be interrupt by this BlockTokenizer.
   */
  readonly interruptableTypes?: YastBlockNodeType[]
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
  public readonly isContainer = false
  public readonly recognizedTypes: T[] = [IndentedCodeType]
  public readonly interruptableTypes: YastBlockNodeType[]

  public constructor(props: IndentedCodeTokenizerProps = {}) {
    super({ ...props })
    this.interruptableTypes = props.interruptableTypes || []
  }

  /**
   * @override
   * @see BlockTokenizerMatchPhaseHook
   */
  public eatOpener(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    eatingInfo: EatingLineInfo,
  ): ResultOfEatOpener<T, MS> {
    const { startIndex, firstNonWhitespaceIndex, endIndex } = eatingInfo
    if (firstNonWhitespaceIndex - startIndex < 4) return null

    const line: PhrasingContentLine = {
      nodePoints,
      startIndex: startIndex + 4,
      endIndex,
      firstNonWhitespaceIndex,
    }

    const state: MS = { type: IndentedCodeType, lines: [line] }
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
    const { firstNonWhitespaceIndex, endIndex } = eatingInfo
    let { startIndex } = eatingInfo

    /**
     * Blank line is allowed
     * @see https://github.github.com/gfm/#example-81
     * @see https://github.github.com/gfm/#example-82
     */
    if (firstNonWhitespaceIndex - startIndex < 4) {
      if (firstNonWhitespaceIndex < endIndex) {
        return { status: 'notMatched' }
      }

      // Empty line
      startIndex = endIndex - 1
    } else {
      startIndex = startIndex + 4
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
   * @see BlockTokenizerParsePhaseHook
   */
  public parse(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    postMatchState: Readonly<PMS>,
  ): ResultOfParse<T, PS> {
    /**
     * Blank lines preceding or following an indented code block
     * are not included in it
     * @see https://github.github.com/gfm/#example-87
     */
    const { lines } = postMatchState
    let startLineIndex = 0, endLineIndex = lines.length
    for (; startLineIndex < endLineIndex; ++startLineIndex) {
      const line = lines[startLineIndex]
      if (line.firstNonWhitespaceIndex < line.endIndex) break
    }
    for (; startLineIndex < endLineIndex; --endLineIndex) {
      const line = lines[endLineIndex - 1]
      if (line.firstNonWhitespaceIndex < line.endIndex) break
    }

    const contents: EnhancedYastNodePoint[] =
      mergeContentLinesFaithfully(lines, startLineIndex, endLineIndex)
    const state: PS = {
      type: IndentedCodeType,
      value: calcStringFromNodePoints(contents),
    }
    return { classification: 'flow', state }
  }
}
