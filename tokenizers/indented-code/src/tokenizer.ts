import type { NodePoint } from '@yozora/character'
import type {
  BlockTokenizer,
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerParsePhaseHook,
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
  eatBlockIndent,
  mergeContentLinesFaithfully,
} from '@yozora/tokenizercore-block'
import { IndentedCodeType } from './types'


/**
 * Params for constructing IndentedCodeTokenizer
 */
export interface IndentedCodeTokenizerProps {
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
export class IndentedCodeTokenizer implements
  BlockTokenizer<T, MS, PMS>,
  BlockTokenizerMatchPhaseHook<T, MS>,
  BlockTokenizerParsePhaseHook<T, PMS, PS>
{
  public readonly name = 'IndentedCodeTokenizer'
  public readonly getContext: BlockTokenizer['getContext'] = () => null

  public readonly isContainerBlock = false
  public readonly recognizedTypes: ReadonlyArray<T> = [IndentedCodeType]
  public readonly interruptableTypes: ReadonlyArray<YastBlockNodeType>

  public constructor(props: IndentedCodeTokenizerProps = {}) {
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
    if (eatingInfo.countOfPrecedeSpaces < 4) return null

    const { startIndex, firstNonWhitespaceIndex, endIndex } = eatingInfo
    const startOfIndentedBlock = eatBlockIndent(
      nodePoints, startIndex, firstNonWhitespaceIndex, 4)
    if (startOfIndentedBlock == null) return null

    const line: PhrasingContentLine = {
      nodePoints,
      startIndex: startOfIndentedBlock,
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
    nodePoints: ReadonlyArray<NodePoint>,
    eatingInfo: EatingLineInfo,
    state: MS,
  ): ResultOfEatContinuationText {
    const {
      startIndex,
      endIndex,
      firstNonWhitespaceIndex,
      countOfPrecedeSpaces
    } = eatingInfo
    if (
      countOfPrecedeSpaces < 4 &&
      firstNonWhitespaceIndex < endIndex
    ) return { status: 'notMatched' }

    /**
     * Blank line is allowed
     * @see https://github.github.com/gfm/#example-81
     * @see https://github.github.com/gfm/#example-82
     */
    if (countOfPrecedeSpaces < 4) {
      const line: PhrasingContentLine = {
        nodePoints,
        startIndex: endIndex - 1,
        endIndex,
        firstNonWhitespaceIndex,
      }
      state.lines.push(line)
      return { status: 'opening', nextIndex: endIndex }
    }

    const startOfIndentedBlock = eatBlockIndent(
      nodePoints, startIndex, firstNonWhitespaceIndex, 4)!
    const line: PhrasingContentLine = {
      nodePoints,
      startIndex: startOfIndentedBlock,
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
    nodePoints: ReadonlyArray<NodePoint>,
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

    const contents: NodePoint[] =
      mergeContentLinesFaithfully(lines, startLineIndex, endLineIndex)
    const state: PS = {
      type: IndentedCodeType,
      value: calcStringFromNodePoints(contents),
    }
    return { classification: 'flow', state }
  }
}
