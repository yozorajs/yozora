import { ParagraphDataNodeType } from '@yozora/tokenizer-paragraph'
import {
  DataNodeTokenPointDetail,
  calcStringFromCodePoints,
} from '@yozora/tokenizercore'
import {
  BaseBlockTokenizer,
  BlockTokenizer,
  BlockTokenizerEatContinuationResult,
  BlockTokenizerEatNewMarkerResult,
  BlockTokenizerEatingInfo,
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerParsePhaseHook,
  BlockTokenizerPreMatchPhaseHook,
  BlockTokenizerPreMatchPhaseState,
} from '@yozora/tokenizercore-block'
import {
  IndentedCodeDataNode,
  IndentedCodeDataNodeType,
  IndentedCodeMatchPhaseState,
  IndentedCodePreMatchPhaseState,
} from './types'


type T = IndentedCodeDataNodeType


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
    BlockTokenizerPreMatchPhaseHook<
      T,
      IndentedCodePreMatchPhaseState>,
    BlockTokenizerMatchPhaseHook<
      T,
      IndentedCodePreMatchPhaseState,
      IndentedCodeMatchPhaseState>,
    BlockTokenizerParsePhaseHook<
      T,
      IndentedCodeMatchPhaseState,
      IndentedCodeDataNode>
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
  ): BlockTokenizerEatNewMarkerResult<T, IndentedCodePreMatchPhaseState> {
    const { startIndex, firstNonWhiteSpaceIndex, endIndex } = eatingInfo
    if (firstNonWhiteSpaceIndex - startIndex < 4) return null

    /**
     * An indented code block cannot interrupt a paragraph, so there must be
     * a blank line between a paragraph and a following indented code block.
     * (A blank line is not needed, however, between a code block and a
     * following paragraph.)
     * @see https://github.github.com/gfm/#example-83
     *
     * It should be noted that what should actually be considered is the last
     * unclosed Paragraph node
     * @see https://github.github.com/gfm/#example-216
     */
    if (parentState.children!.length > 0) {
      let latestOpenNode = parentState.children![parentState.children!.length - 1]
      while (latestOpenNode.opening && latestOpenNode.children != null) {
        if (latestOpenNode.children.length <= 0) break
        latestOpenNode = latestOpenNode.children[latestOpenNode.children.length - 1]
      }
      if (!latestOpenNode.opening) latestOpenNode = latestOpenNode.parent
      if (latestOpenNode.type === ParagraphDataNodeType) return null
    }

    const state: IndentedCodePreMatchPhaseState = {
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
    state: IndentedCodePreMatchPhaseState,
  ): BlockTokenizerEatContinuationResult {
    const { isBlankLine, startIndex, firstNonWhiteSpaceIndex, endIndex } = eatingInfo

    /**
     * Blank line is allowed
     * @see https://github.github.com/gfm/#example-81
     * @see https://github.github.com/gfm/#example-82
     */
    if (firstNonWhiteSpaceIndex - startIndex < 4) {
      if (!isBlankLine) return null
      state.content.push(codePositions[endIndex - 1])
    } else {
      for (let i = startIndex + 4; i < endIndex; ++i) {
        state.content.push(codePositions[i])
      }
    }
    return { resultType: 'continue', nextIndex: endIndex, saturated: false }
  }

  /**
   * hook of @BlockTokenizerMatchPhaseHook
   */
  public match(
    preMatchPhaseState: IndentedCodePreMatchPhaseState
  ): IndentedCodeMatchPhaseState {
    const result: IndentedCodeMatchPhaseState = {
      type: preMatchPhaseState.type,
      classify: 'flow',
      content: preMatchPhaseState.content,
    }
    return result
  }

  /**
   * hook of @BlockTokenizerParsePhaseHook
   */
  public parseFlow(
    matchPhaseState: IndentedCodeMatchPhaseState,
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
      value,
    }
    return result
  }
}
