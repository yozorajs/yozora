import {
  BaseBlockDataNodeTokenizer,
  BlockDataNodeEatingLineInfo,
  BlockDataNodeEatingResult,
  BlockDataNodeMatchResult,
  BlockDataNodeMatchState,
  BlockDataNodeTokenizer,
  DataNodeTokenPointDetail,
  calcStringFromCodePoints,
} from '@yozora/tokenizer-core'
import { ParagraphDataNodeType } from '@yozora/tokenizer-paragraph'
import {
  IndentedCodeDataNode,
  IndentedCodeDataNodeData,
  IndentedCodeDataNodeType,
} from './types'


type T = IndentedCodeDataNodeType


export interface IndentedCodeDataNodeMatchState extends BlockDataNodeMatchState<T> {
  codePoints: DataNodeTokenPointDetail[]
}


export interface IndentedCodeDataNodeMatchResult extends BlockDataNodeMatchResult<T> {
  codePoints: DataNodeTokenPointDetail[]
}


/**
 * Lexical Analyzer for IndentedCodeDataNode
 *
 * An indented code block is composed of one or more indented chunks
 * separated by blank lines. An indented chunk is a sequence of non-blank
 * lines, each indented four or more spaces. The contents of the code block
 * are the literal contents of the lines, including trailing line endings,
 * minus four spaces of indentation.
 * @see https://github.github.com/gfm/#indented-code-block
 */
export class IndentedCodeTokenizer extends BaseBlockDataNodeTokenizer<
  T,
  IndentedCodeDataNodeData,
  IndentedCodeDataNodeMatchState,
  IndentedCodeDataNodeMatchResult>
  implements BlockDataNodeTokenizer<
  T,
  IndentedCodeDataNodeData,
  IndentedCodeDataNodeMatchState,
  IndentedCodeDataNodeMatchResult> {
  public readonly name = 'IndentedCodeTokenizer'
  public readonly recognizedTypes: T[] = [IndentedCodeDataNodeType]

  /**
   * override
   */
  public eatNewMarker(
    codePoints: DataNodeTokenPointDetail[],
    eatingLineInfo: BlockDataNodeEatingLineInfo,
    parentState: BlockDataNodeMatchState,
  ): BlockDataNodeEatingResult<T, IndentedCodeDataNodeMatchState> | null {
    const { startIndex, firstNonWhiteSpaceIndex, endIndex } = eatingLineInfo
    if (firstNonWhiteSpaceIndex - startIndex < 4) return null

    /**
     * An indented code block cannot interrupt a paragraph, so there must be
     * a blank line between a paragraph and a following indented code block.
     * (A blank line is not needed, however, between a code block and a
     * following paragraph.)
     * @see https://github.github.com/gfm/#example-83
     */
    if (parentState.children!.length > 0) {
      const previousSiblingNode = parentState.children![parentState.children!.length - 1]
      if (previousSiblingNode.type === ParagraphDataNodeType) return null
    }
    const state: IndentedCodeDataNodeMatchState = {
      type: IndentedCodeDataNodeType,
      opening: true,
      parent: parentState,
      codePoints: codePoints.slice(startIndex + 4, endIndex),
    }
    return { nextIndex: endIndex, state }
  }

  /**
   * override
   */
  public eatContinuationText(
    codePoints: DataNodeTokenPointDetail[],
    eatingLineInfo: BlockDataNodeEatingLineInfo,
    state: IndentedCodeDataNodeMatchState,
  ): BlockDataNodeEatingResult<T, IndentedCodeDataNodeMatchState> | null {
    const { isBlankLine, startIndex, firstNonWhiteSpaceIndex, endIndex } = eatingLineInfo

    // blank line is allowed
    if (!isBlankLine && firstNonWhiteSpaceIndex - startIndex < 4) return null

    if (firstNonWhiteSpaceIndex - startIndex < 4) {
      state.codePoints.push(codePoints[endIndex - 1])
    } else {
      for (let i = startIndex + 4; i < endIndex; ++i) {
        state.codePoints.push(codePoints[i])
      }
    }

    return { nextIndex: endIndex, state }
  }

  /**
   * override
   */
  public match(state: IndentedCodeDataNodeMatchState): IndentedCodeDataNodeMatchResult {
    const result: IndentedCodeDataNodeMatchResult = {
      type: state.type,
      codePoints: state.codePoints,
    }
    return result
  }

  /**
   * override
   */
  public parse(
    codePoints: DataNodeTokenPointDetail[],
    matchResult: IndentedCodeDataNodeMatchResult,
  ): IndentedCodeDataNode {
    /**
     * Blank lines preceding or following an indented code block are not included in it
     * @see https://github.github.com/gfm/#example-87
     */
    const value: string = calcStringFromCodePoints(matchResult.codePoints)
      .replace(/^(?:[^\S\n]*\n)+/g, '')
      .replace(/(?:[^\S\n]*\n)+$/g, '')

    const result: IndentedCodeDataNode = {
      type: matchResult.type,
      data: {
        value,
      }
    }
    return result
  }
}
