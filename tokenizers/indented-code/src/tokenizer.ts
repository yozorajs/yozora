import type { NodePoint } from '@yozora/character'
import type {
  PhrasingContentLine,
  ResultOfEatContinuationText,
  ResultOfEatOpener,
  ResultOfParse,
  Tokenizer,
  TokenizerMatchBlockHook,
  TokenizerParseBlockHook,
  YastNodeType,
} from '@yozora/tokenizercore'
import type {
  IndentedCode as Node,
  IndentedCodeState as State,
  IndentedCodeType as T,
} from './types'
import {
  AsciiCodePoint,
  VirtualCodePoint,
  calcStringFromNodePoints,
} from '@yozora/character'
import {
  calcEndYastNodePoint,
  calcStartYastNodePoint,
  mergeContentLinesFaithfully,
} from '@yozora/tokenizercore'
import { IndentedCodeType } from './types'


/**
 * Params for constructing IndentedCodeTokenizer
 */
export interface IndentedCodeTokenizerProps {
  /**
   * Specify an array of YastNode types that can be interrupted by this
   * Tokenizer on match phase.
   */
  readonly interruptableTypes?: YastNodeType[]
}


/**
 * Lexical Analyzer for IndentedCode.
 *
 * An indented code block is composed of one or more indented chunks
 * separated by blank lines. An indented chunk is a sequence of non-blank
 * lines, each indented four or more spaces. The contents of the code block
 * are the literal contents of the lines, including trailing line endings,
 * minus four spaces of indentation.
 *
 * @see https://github.github.com/gfm/#indented-code-block
 */
export class IndentedCodeTokenizer implements
  Tokenizer,
  TokenizerMatchBlockHook<T, State>,
  TokenizerParseBlockHook<T, State, Node>
{
  public readonly name: string = IndentedCodeTokenizer.name
  public readonly getContext: Tokenizer['getContext'] = () => null

  public readonly isContainerBlock = false
  public readonly interruptableTypes: ReadonlyArray<YastNodeType>
  public readonly recognizedTypes: ReadonlyArray<T> = [IndentedCodeType]

  /* istanbul ignore next */
  public constructor(props: IndentedCodeTokenizerProps = {}) {
    this.interruptableTypes = Array.isArray(props.interruptableTypes)
      ? [...props.interruptableTypes]
      : []
  }

  /**
   * @override
   * @see TokenizerMatchBlockHook
   */
  public eatOpener(line: Readonly<PhrasingContentLine>): ResultOfEatOpener<T, State> {
    if (line.countOfPrecedeSpaces < 4) return null
    const { nodePoints, startIndex, firstNonWhitespaceIndex, endIndex } = line

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

    const nextIndex = endIndex
    const state: State = {
      type: IndentedCodeType,
      position: {
        start: calcStartYastNodePoint(nodePoints, startIndex),
        end: calcEndYastNodePoint(nodePoints, nextIndex - 1),
      },
      lines: [{
        nodePoints,
        startIndex: firstIndex,
        endIndex,
        firstNonWhitespaceIndex,
        countOfPrecedeSpaces: line.countOfPrecedeSpaces - (firstIndex - startIndex),
      }]
    }
    return { state, nextIndex }
  }

  /**
   * @override
   * @see TokenizerMatchBlockHook
   */
  public eatContinuationText(
    line: Readonly<PhrasingContentLine>,
    state: State,
  ): ResultOfEatContinuationText {
    const {
      nodePoints,
      startIndex,
      endIndex,
      firstNonWhitespaceIndex,
      countOfPrecedeSpaces,
    } = line

    if (
      countOfPrecedeSpaces < 4 &&
      firstNonWhitespaceIndex < endIndex
    ) return { status: 'notMatched' }

    /**
     * Blank line is allowed
     * @see https://github.github.com/gfm/#example-81
     * @see https://github.github.com/gfm/#example-82
     */
    const firstIndex = Math.min(endIndex - 1, startIndex + 4)
    state.lines.push({
      nodePoints,
      startIndex: firstIndex,
      endIndex,
      firstNonWhitespaceIndex,
      countOfPrecedeSpaces: countOfPrecedeSpaces - (firstIndex - startIndex),
    })
    return { status: 'opening', nextIndex: endIndex }
  }

  /**
   * @override
   * @see TokenizerParseBlockHook
   */
  public parse(state: Readonly<State>): ResultOfParse<T, Node> {
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
