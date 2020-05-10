import {
  BaseBlockTokenizer,
  BlockTokenizer,
  BlockTokenizerEatingInfo,
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseHook,
  BlockTokenizerPreMatchPhaseHook,
  BlockTokenizerPreMatchPhaseState,
} from '@yozora/block-tokenizer-core'
import {
  DataNodeTokenPointDetail,
  calcStringFromCodePoints,
} from '@yozora/tokenizer-core'
import { ParagraphDataNodeType } from '@yozora/tokenizer-paragraph'
import { IndentedCodeDataNode, IndentedCodeDataNodeType } from './types'


type T = IndentedCodeDataNodeType


/**
 * State of pre-match phase of IndentedCodeTokenizer
 */
export interface IndentedCodeTokenizerPreMatchPhaseState
  extends BlockTokenizerPreMatchPhaseState<T> {
  /**
   *
   */
  content: DataNodeTokenPointDetail[]
}


/**
 * State of match phase of IndentedCodeTokenizer
 */
export interface IndentedCodeTokenizerMatchPhaseState
  extends BlockTokenizerMatchPhaseState<T> {
  /**
   *
   */
  content: DataNodeTokenPointDetail[]
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
export class IndentedCodeTokenizer extends BaseBlockTokenizer<T>
  implements
    BlockTokenizer<T>,
    BlockTokenizerPreMatchPhaseHook<T, IndentedCodeTokenizerPreMatchPhaseState>,
    BlockTokenizerMatchPhaseHook<T, IndentedCodeTokenizerPreMatchPhaseState, IndentedCodeTokenizerMatchPhaseState>,
    BlockTokenizerParsePhaseHook<T, IndentedCodeTokenizerMatchPhaseState, IndentedCodeDataNode>
{
  public readonly name = 'IndentedCodeTokenizer'
  public readonly uniqueTypes: T[] = [IndentedCodeDataNodeType]

  /**
   * hook of @BlockTokenizerPreMatchPhaseHook
   */
  public eatNewMarker(
    codePositions: DataNodeTokenPointDetail[],
    eatingInfo: BlockTokenizerEatingInfo,
    parentState: Readonly<BlockTokenizerPreMatchPhaseState>,
  ): {
    nextIndex: number,
    state: IndentedCodeTokenizerPreMatchPhaseState,
  } | null {
    const { startIndex, firstNonWhiteSpaceIndex, endIndex } = eatingInfo
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
    const state: IndentedCodeTokenizerPreMatchPhaseState = {
      type: IndentedCodeDataNodeType,
      opening: true,
      parent: parentState,
      content: codePositions.slice(startIndex + 4, endIndex),
    }
    return { nextIndex: endIndex, state }
  }

  /**
   * hook of @BlockTokenizerPreMatchPhaseHook
   */
  public eatContinuationText(
    codePositions: DataNodeTokenPointDetail[],
    eatingInfo: BlockTokenizerEatingInfo,
    state: IndentedCodeTokenizerPreMatchPhaseState,
  ): number | -1 {
    const { isBlankLine, startIndex, firstNonWhiteSpaceIndex, endIndex } = eatingInfo

    /**
     * Blank line is allowed
     * @see https://github.github.com/gfm/#example-81
     * @see https://github.github.com/gfm/#example-82
     */
    if (firstNonWhiteSpaceIndex - startIndex < 4) {
      if (!isBlankLine) return -1
      state.content.push(codePositions[endIndex - 1])
    } else {
      for (let i = startIndex + 4; i < endIndex; ++i) {
        state.content.push(codePositions[i])
      }
    }

    return endIndex
  }

  /**
   * hook of @BlockTokenizerMatchPhaseHook
   */
  public match(
    preMatchPhaseState: IndentedCodeTokenizerPreMatchPhaseState
  ): IndentedCodeTokenizerMatchPhaseState {
    const result: IndentedCodeTokenizerMatchPhaseState = {
      type: preMatchPhaseState.type,
      classify: 'flow',
      content: preMatchPhaseState.content,
    }
    return result
  }

  /**
   * hook of @BlockTokenizerParseFlowPhaseHook
   */
  public parseFlow(
    matchPhaseState: IndentedCodeTokenizerMatchPhaseState,
  ): IndentedCodeDataNode {
    /**
     * Blank lines preceding or following an indented code block are not included in it
     * @see https://github.github.com/gfm/#example-87
     */
    const value: string = calcStringFromCodePoints(matchPhaseState.content)
      .replace(/^(?:[^\S\n]*\n)+/g, '')
      .replace(/(?:[^\S\n]*\n)+$/g, '')

    const result: IndentedCodeDataNode = {
      type: matchPhaseState.type,
      data: {
        value,
      }
    }
    return result
  }
}
