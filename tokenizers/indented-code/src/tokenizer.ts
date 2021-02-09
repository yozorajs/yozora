import type { NodePoint } from '@yozora/character'
import type { YastNodeType } from '@yozora/tokenizercore'
import type {
  BlockTokenizer,
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerParsePhaseHook,
  EatingLineInfo,
  PhrasingContentLine,
  ResultOfEatContinuationText,
  ResultOfEatOpener,
  ResultOfParse,
} from '@yozora/tokenizercore-block'
import type {
  IndentedCode as Node,
  IndentedCodeMatchPhaseState as MS,
  IndentedCodePostMatchPhaseState as PMS,
  IndentedCodeType as T,
} from './types'
import {
  AsciiCodePoint,
  VirtualCodePoint,
  calcStringFromNodePoints,
} from '@yozora/character'
import { mergeContentLinesFaithfully } from '@yozora/tokenizercore-block'
import { IndentedCodeType } from './types'


/**
 * Params for constructing IndentedCodeTokenizer
 */
export interface IndentedCodeTokenizerProps {
  /**
   * YastNode types that can be interrupt by this BlockTokenizer.
   */
  readonly interruptableTypes?: YastNodeType[]
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
  BlockTokenizerParsePhaseHook<T, PMS, Node>
{
  public readonly name = 'IndentedCodeTokenizer'
  public readonly getContext: BlockTokenizer['getContext'] = () => null

  public readonly isContainerBlock = false
  public readonly interruptableTypes: ReadonlyArray<YastNodeType>
  public readonly recognizedTypes: ReadonlyArray<T> = [IndentedCodeType]

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

    let firstIndex = startIndex + 4

    /**
     * If there exists 1-3 spaces before a tab forms the indent, the remain
     * virtual spaces of the tab should not be a part of the contents.
     * @see https://github.github.com/gfm/#example-2
     */
    if (
      nodePoints[startIndex].codePoint === AsciiCodePoint.SPACE &&
      nodePoints[startIndex + 3].codePoint === VirtualCodePoint.SPACE
    ) {
      let i = startIndex + 1
      for (; i < firstNonWhitespaceIndex; ++i) {
        if (nodePoints[i].codePoint === VirtualCodePoint.SPACE) break
      }
      firstIndex = i + 4
    }

    const line: PhrasingContentLine = {
      nodePoints,
      startIndex: firstIndex,
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
    const line: PhrasingContentLine = {
      nodePoints,
      startIndex: Math.min(endIndex - 1, startIndex + 4),
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
  public parse(state: Readonly<PMS>): ResultOfParse<T, Node> {
    /**
     * Blank lines preceding or following an indented code block
     * are not included in it
     * @see https://github.github.com/gfm/#example-87
     */
    const { lines } = state
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
    const node: Node = {
      type: IndentedCodeType,
      value: calcStringFromNodePoints(contents),
    }
    return { classification: 'flow', node }
  }
}
