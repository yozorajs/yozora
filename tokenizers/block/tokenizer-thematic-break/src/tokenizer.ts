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
  AsciiCodePoint,
  isUnicodeWhiteSpaceCharacter,
} from '@yozora/character'
import { DataNodeTokenPointDetail } from '@yozora/tokenizercore'
import { ThematicBreakDataNode, ThematicBreakDataNodeType } from './types'


type T = ThematicBreakDataNodeType


/**
 * State of pre-match phase of ThematicBreakTokenizer
 */
export interface ThematicBreakTokenizerPreMatchPhaseState
  extends BlockTokenizerPreMatchPhaseState<T> {

}


/**
 * State of match phase of ThematicBreakTokenizer
 */
export interface ThematicBreakTokenizerMatchPhaseState
  extends BlockTokenizerMatchPhaseState<T> {

}


/**
 * Lexical Analyzer for ThematicBreakDataNode
 *
 * A line consisting of 0-3 spaces of indentation, followed by a sequence of
 * three or more matching -, _, or * characters, each followed optionally by
 * any number of spaces or tabs, forms a thematic break
 * @see https://github.github.com/gfm/#thematic-break
 */
export class ThematicBreakTokenizer extends BaseBlockTokenizer<T>
  implements
    BlockTokenizer<T>,
    BlockTokenizerPreMatchPhaseHook<T, ThematicBreakTokenizerPreMatchPhaseState>,
    BlockTokenizerMatchPhaseHook<T, ThematicBreakTokenizerPreMatchPhaseState, ThematicBreakTokenizerMatchPhaseState>,
    BlockTokenizerParsePhaseHook<T, ThematicBreakTokenizerMatchPhaseState, ThematicBreakDataNode>
{
  public readonly name = 'ThematicBreakTokenizer'
  public readonly uniqueTypes: T[] = [ThematicBreakDataNodeType]

  /**
   * hook of @BlockTokenizerPreMatchPhaseHook
   */
  public eatNewMarker(
    codePositions: DataNodeTokenPointDetail[],
    eatingInfo: BlockTokenizerEatingInfo,
    parentState: Readonly<BlockTokenizerPreMatchPhaseState>,
  ): {
    nextIndex: number,
    state: ThematicBreakTokenizerPreMatchPhaseState,
  } | null {
    if (eatingInfo.isBlankLine) return null
    const { startIndex, endIndex, firstNonWhiteSpaceIndex } = eatingInfo

    /**
     * Four spaces is too much
     * @see https://github.github.com/gfm/#example-19
     */
    if (firstNonWhiteSpaceIndex - startIndex >= 4) return null

    let marker: number, count = 0
    for (let i = firstNonWhiteSpaceIndex; i < endIndex; ++i) {
      const c = codePositions[i]

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

    const state: ThematicBreakTokenizerPreMatchPhaseState = {
      type: ThematicBreakDataNodeType,
      opening: true,
      parent: parentState,
    }
    return { nextIndex: endIndex, state }
  }

  /**
   * hook of @BlockTokenizerMatchPhaseHook
   */
  public match(
    preMatchPhaseState: ThematicBreakTokenizerPreMatchPhaseState,
  ): ThematicBreakTokenizerMatchPhaseState {
    const result: ThematicBreakTokenizerMatchPhaseState = {
      type: preMatchPhaseState.type,
      classify: 'flow',
    }
    return result
  }

  /**
   * hook of @BlockTokenizerParseFlowPhaseHook
   */
  public parseFlow(
    matchPhaseState: ThematicBreakTokenizerMatchPhaseState,
  ): ThematicBreakDataNode {
    const result: ThematicBreakDataNode = {
      type: matchPhaseState.type,
    }
    return result
  }
}
