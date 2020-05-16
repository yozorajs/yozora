import { isWhiteSpaceCharacter } from '@yozora/character'
import { DataNodeTokenPointDetail } from '@yozora/tokenizercore'
import {
  BaseBlockTokenizer,
  BlockTokenizer,
  BlockTokenizerEatingInfo,
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseHook,
  BlockTokenizerPreMatchPhaseHook,
  BlockTokenizerPreMatchPhaseState,
  BlockTokenizerPreParsePhaseState,
} from '@yozora/tokenizercore-block'
import { PhrasingContentDataNode, PhrasingContentDataNodeType } from './types'


type T = PhrasingContentDataNodeType


/**
 * line of PhrasingContent
 */
export interface PhrasingContentLine {
  /**
   * code points of current line
   */
  codePositions: DataNodeTokenPointDetail[]
  /**
   * 当前行剩余内容第一个非空白字符的下标
   * The index of first non-blank character in the rest of the current line
   */
  firstNonWhiteSpaceIndex: number
}



/**
 * State of pre-match phase of PhrasingContentTokenizer
 */
export interface PhrasingContentTokenizerPreMatchPhaseState
  extends BlockTokenizerPreMatchPhaseState<T> {
  /**
   * PhrasingContent 中的文本内容
   */
  lines: PhrasingContentLine[]
}


/**
 * State of match phase of PhrasingContentTokenizer
 */
export interface PhrasingContentTokenizerMatchPhaseState
  extends BlockTokenizerMatchPhaseState<T> {
  /**
   * PhrasingContent 中的文本内容
   */
  lines: PhrasingContentLine[]
}


/**
 * Lexical Analyzer for PhrasingContentDataNode
 *
 * A sequence of non-blank lines that cannot be interpreted as other kinds
 * of blocks forms a phrasingContent. The contents of the phrasingContent are the result
 * of parsing the phrasingContent’s raw content as inlines. The phrasingContent’s raw
 * content is formed by concatenating the lines and removing initial and
 * final whitespace.
 * @see https://github.github.com/gfm/#phrasingcontents
 */
export class PhrasingContentTokenizer extends BaseBlockTokenizer<T>
  implements
    BlockTokenizer<T>,
    BlockTokenizerPreMatchPhaseHook<
      T,
      PhrasingContentTokenizerPreMatchPhaseState>,
    BlockTokenizerMatchPhaseHook<
      T,
      PhrasingContentTokenizerPreMatchPhaseState,
      PhrasingContentTokenizerMatchPhaseState>,
    BlockTokenizerParsePhaseHook<
      T,
      PhrasingContentTokenizerMatchPhaseState,
      PhrasingContentDataNode>
{
  public readonly name = 'PhrasingContentTokenizer'
  public readonly uniqueTypes: T[] = [PhrasingContentDataNodeType]

  /**
   * hook of @BlockTokenizerPreMatchPhaseHook
   */
  public eatNewMarker(
    codePositions: DataNodeTokenPointDetail[],
    eatingInfo: BlockTokenizerEatingInfo,
    parentState: Readonly<BlockTokenizerPreMatchPhaseState>,
  ): { nextIndex: number, state: PhrasingContentTokenizerPreMatchPhaseState } | null {
    if (eatingInfo.isBlankLine) return null
    const { startIndex, endIndex, firstNonWhiteSpaceIndex } = eatingInfo
    const line: PhrasingContentLine = {
      codePositions: codePositions.slice(startIndex, endIndex),
      firstNonWhiteSpaceIndex: firstNonWhiteSpaceIndex - startIndex,
    }
    const state: PhrasingContentTokenizerPreMatchPhaseState = {
      type: PhrasingContentDataNodeType,
      opening: true,
      parent: parentState,
      lines: [line],
    }
    return { nextIndex: endIndex, state }
  }

  /**
   * hook of @BlockTokenizerPreMatchPhaseHook
   */
  public eatContinuationText(
    codePositions: DataNodeTokenPointDetail[],
    eatingInfo: BlockTokenizerEatingInfo,
    state: PhrasingContentTokenizerPreMatchPhaseState,
  ): { nextIndex: number, saturated: boolean } | null {
    /**
     * PhrasingContents can contain multiple lines, but no blank lines
     * @see https://github.github.com/gfm/#example-190
     */
    if (eatingInfo.isBlankLine) return null
    const { startIndex, endIndex, firstNonWhiteSpaceIndex } = eatingInfo

    const line: PhrasingContentLine = {
      codePositions: codePositions.slice(startIndex, endIndex),
      firstNonWhiteSpaceIndex: firstNonWhiteSpaceIndex - startIndex,
    }
    state.lines.push(line)
    return { nextIndex: endIndex, saturated: false }
  }

  /**
   * hook of @BlockTokenizerPreMatchPhaseHook
   */
  public eatLazyContinuationText(
    codePositions: DataNodeTokenPointDetail[],
    eatingInfo: BlockTokenizerEatingInfo,
    state: PhrasingContentTokenizerPreMatchPhaseState,
  ): { nextIndex: number, saturated: boolean } | null {
    return this.eatContinuationText(codePositions, eatingInfo, state)
  }

  /**
   * hook of @BlockTokenizerMatchPhaseHook
   */
  public match(
    preMatchPhaseState: PhrasingContentTokenizerPreMatchPhaseState,
  ): PhrasingContentTokenizerMatchPhaseState {
    const result: PhrasingContentTokenizerMatchPhaseState = {
      type: preMatchPhaseState.type,
      classify: 'flow',
      lines: preMatchPhaseState.lines,
    }
    return result
  }

  /**
   * hook of @BlockTokenizerParsePhaseHook
   */
  public parseFlow(
    matchPhaseState: PhrasingContentTokenizerMatchPhaseState,
    preParsePhaseState: BlockTokenizerPreParsePhaseState,
  ): PhrasingContentDataNode {
    const self = this
    const result: PhrasingContentDataNode = {
      type: matchPhaseState.type,
      contents: [],
    }

    const contents = []
    for (let i = 0; i + 1 < matchPhaseState.lines.length; ++i) {
      const line = matchPhaseState.lines[i]
      const { firstNonWhiteSpaceIndex, codePositions } = line
      const endIndex = codePositions.length

      /**
       * Leading spaces are skipped
       * @see https://github.github.com/gfm/#example-192
       */
      for (let i = firstNonWhiteSpaceIndex; i < endIndex; ++i) {
        contents.push(codePositions[i])
      }
    }

    /**
     * Final spaces are stripped before inline parsing, so a phrasingContent that
     * ends with two or more spaces will not end with a hard line break
     * @see https://github.github.com/gfm/#example-196
     */
    if (matchPhaseState.lines.length > 0) {
      const line = matchPhaseState.lines[matchPhaseState.lines.length - 1]
      const { firstNonWhiteSpaceIndex, codePositions } = line

      let lastNonWhiteSpaceIndex = codePositions.length - 1
      for (; lastNonWhiteSpaceIndex >= 0; --lastNonWhiteSpaceIndex) {
        const c = codePositions[lastNonWhiteSpaceIndex]
        if (!isWhiteSpaceCharacter(c.codePoint)) break
      }
      for (let i = firstNonWhiteSpaceIndex; i <= lastNonWhiteSpaceIndex; ++i) {
        contents.push(codePositions[i])
      }
    }

    if (self.parseInlineData != null) {
      const innerData = self.parseInlineData(
        contents, 0, contents.length, preParsePhaseState.meta)
      result.contents = innerData
    }
    return result
  }
}
