import { AsciiCodePoint, isUnicodeWhiteSpaceCharacter } from '@yozora/character'
import {
  BaseBlockDataNodeTokenizer,
  BlockDataNodeEatingLineInfo,
  BlockDataNodeEatingResult,
  BlockDataNodeMatchResult,
  BlockDataNodeMatchState,
  BlockDataNodeTokenizer,
  DataNodeTokenPointDetail,
} from '@yozora/tokenizer-core'
import {
  ThematicBreakDataNode,
  ThematicBreakDataNodeData,
  ThematicBreakDataNodeType,
} from './types'


type T = ThematicBreakDataNodeType


export interface ThematicBreakDataNodeMatchState extends BlockDataNodeMatchState<T> {

}


export interface ThematicBreakDataNodeMatchResult extends BlockDataNodeMatchResult<T> {

}


/**
 * Lexical Analyzer for ThematicBreakDataNode
 *
 * A line consisting of 0-3 spaces of indentation, followed by a sequence of
 * three or more matching -, _, or * characters, each followed optionally by
 * any number of spaces or tabs, forms a thematic break
 * @see https://github.github.com/gfm/#thematic-break
 */
export class ThematicBreakTokenizer extends BaseBlockDataNodeTokenizer<
  T,
  ThematicBreakDataNodeData,
  ThematicBreakDataNodeMatchState,
  ThematicBreakDataNodeMatchResult>
  implements BlockDataNodeTokenizer<
  T,
  ThematicBreakDataNodeData,
  ThematicBreakDataNodeMatchState,
  ThematicBreakDataNodeMatchResult> {
  public readonly name = 'ThematicBreakTokenizer'
  public readonly recognizedTypes: T[] = [ThematicBreakDataNodeType]

  /**
   * override
   */
  public eatNewMarker(
    codePoints: DataNodeTokenPointDetail[],
    eatingLineInfo: BlockDataNodeEatingLineInfo,
    parentState: BlockDataNodeMatchState,
  ): BlockDataNodeEatingResult<T, ThematicBreakDataNodeMatchState> | null {
    if (eatingLineInfo.isBlankLine) return null
    const { startIndex, endIndex, firstNonWhiteSpaceIndex } = eatingLineInfo

    /**
     * Four spaces is too much
     * @see https://github.github.com/gfm/#example-19
     */
    if (firstNonWhiteSpaceIndex - startIndex >= 4) return null


    let marker: number, count = 0
    for (let i = firstNonWhiteSpaceIndex; i < endIndex; ++i) {
      const c = codePoints[i]

      /**
       * Spaces are allowed between the characters
       * Spaces are allowed at the end
       * @see https://github.github.com/gfm/#example-21
       * @see https://github.github.com/gfm/#example-22
       * @see https://github.github.com/gfm/#example-23
       * @see https://github.github.com/gfm/#example-24
       */
      if (isUnicodeWhiteSpaceCharacter(c.codePoint)) continue

      switch (c.codePoint) {
        /**
         * A line consisting of 0-3 spaces of indentation, followed by a
         * sequence of three or more matching '-', '_', or '*' characters,
         * each followed optionally by any number of spaces or tabs, forms
         * a thematic break
         */
        case AsciiCodePoint.MINUS_SIGN:
        case AsciiCodePoint.UNDERSCORE:
        case AsciiCodePoint.ASTERISK: {
          if (count <= 0) {
            marker = c.codePoint
            ++count
            break
          }
          /**
           * It is required that all of the non-whitespace characters be the same
           * @see https://github.github.com/gfm/#example-26
           */
          if (c.codePoint !== marker!) return null
          ++count
          break
        }
        /**
         * No other characters may occur in the line
         * @see https://github.github.com/gfm/#example-25
         */
        default:
          return null
      }
    }

    /**
     * Not enough characters
     * @see https://github.github.com/gfm/#example-16
     */
    if (count < 3) {
      return null
    }

    const state: ThematicBreakDataNodeMatchState = {
      type: ThematicBreakDataNodeType,
      opening: true,
      parent: parentState,
    }
    return { nextIndex: endIndex, state }
  }

  /**
   * override
   */
  public match(
    state: ThematicBreakDataNodeMatchState,
    children: BlockDataNodeMatchResult[],
  ): ThematicBreakDataNodeMatchResult {
    const result: ThematicBreakDataNodeMatchResult = {
      type: state.type,
      children,
    }
    return result
  }

  /**
   * override
   */
  public parse(
    codePoints: DataNodeTokenPointDetail[],
    matchResult: ThematicBreakDataNodeMatchResult,
  ): ThematicBreakDataNode {
    const result: ThematicBreakDataNode = {
      type: matchResult.type,
    }
    return result
  }
}
