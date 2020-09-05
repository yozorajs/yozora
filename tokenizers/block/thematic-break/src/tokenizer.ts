import {
  AsciiCodePoint,
  isUnicodeWhiteSpaceCharacter,
} from '@yozora/character'
import { ParagraphDataNodeType } from '@yozora/tokenizer-paragraph'
import { DataNodeTokenPointDetail } from '@yozora/tokenizercore'
import {
  BaseBlockTokenizer,
  BlockTokenizer,
  BlockTokenizerEatAndInterruptResult,
  BlockTokenizerEatNewMarkerResult,
  BlockTokenizerEatingInfo,
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerParsePhaseHook,
  BlockTokenizerPreMatchPhaseHook,
  BlockTokenizerPreMatchPhaseState,
} from '@yozora/tokenizercore-block'
import {
  ThematicBreakDataNode,
  ThematicBreakDataNodeType,
  ThematicBreakMatchPhaseState,
  ThematicBreakPreMatchPhaseState,
} from './types'


type T = ThematicBreakDataNodeType


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
    BlockTokenizerPreMatchPhaseHook<
      T,
      ThematicBreakPreMatchPhaseState>,
    BlockTokenizerMatchPhaseHook<
      T,
      ThematicBreakPreMatchPhaseState,
      ThematicBreakMatchPhaseState>,
    BlockTokenizerParsePhaseHook<
      T,
      ThematicBreakMatchPhaseState,
      ThematicBreakDataNode>
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
  ): BlockTokenizerEatNewMarkerResult<T, ThematicBreakPreMatchPhaseState> {
    if (eatingInfo.isBlankLine) return null
    const { startIndex, endIndex, firstNonWhiteSpaceIndex } = eatingInfo

    /**
     * Four spaces is too much
     * @see https://github.github.com/gfm/#example-19
     */
    if (firstNonWhiteSpaceIndex - startIndex >= 4) return null

    let marker: number, count = 0
    let continuous = true, hasPotentialInternalSpace = false
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
      if (isUnicodeWhiteSpaceCharacter(c.codePoint)) {
        hasPotentialInternalSpace = true
        continue
      }

      /**
       * As it is traversed from a non-empty character, if a blank character
       * has been encountered before, it means that there is an internal space
       */
      if (hasPotentialInternalSpace) {
        continuous = false
      }

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
            count += 1
            break
          }
          /**
           * It is required that all of the non-whitespace characters be the same
           * @see https://github.github.com/gfm/#example-26
           */
          if (c.codePoint !== marker!) return null
          count += 1
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

    const state: ThematicBreakPreMatchPhaseState = {
      type: ThematicBreakDataNodeType,
      opening: true,
      parent: parentState,
      marker: marker!,
      continuous,
      interruptPrevious: false,
    }
    return { nextIndex: endIndex, state }
  }

  /**
   * hook of @BlockTokenizerPreMatchPhaseHook
   */
  public eatAndInterruptPreviousSibling(
    codePositions: DataNodeTokenPointDetail[],
    eatingInfo: BlockTokenizerEatingInfo,
    parentState: Readonly<BlockTokenizerPreMatchPhaseState>,
    previousSiblingState: Readonly<BlockTokenizerPreMatchPhaseState>,
  ): BlockTokenizerEatAndInterruptResult<T, ThematicBreakPreMatchPhaseState> {
    const self = this
    switch (previousSiblingState.type) {
      /**
       * Thematic breaks can interrupt a paragraph
       */
      case ParagraphDataNodeType: {
        const eatingResult = self.eatNewMarker(codePositions, eatingInfo, parentState)
        if (eatingResult == null) return null

        /**
         * If a line of dashes that meets the above conditions for being a
         * thematic break could also be interpreted as the underline of a
         * setext heading, the interpretation as a setext heading takes
         * precedence. Thus, for example, this is a setext heading, not a
         * paragraph followed by a thematic break
         *
         * It's okay to ignore this rule, just make sure the following conditions hold:
         *    SetextHeadingTokenizer.priority > ThematicBreakTokenizer.priority
         *
         * @see https://github.github.com/gfm/#setext-heading-underline
         * @see https://github.github.com/gfm/#example-29
         */
        // if (eatingResult.state.marker === AsciiCodePoint.MINUS_SIGN) return null

        return {
          nextIndex: eatingResult.nextIndex,
          state: {
            ...eatingResult.state,
            interruptPrevious: true,
          },
          shouldRemovePreviousSibling: false
        }
      }
      default:
        return null
    }
  }

  /**
   * hook of @BlockTokenizerMatchPhaseHook
   */
  public match(
    preMatchPhaseState: ThematicBreakPreMatchPhaseState,
  ): ThematicBreakMatchPhaseState {
    const result: ThematicBreakMatchPhaseState = {
      type: preMatchPhaseState.type,
      classify: 'flow',
      marker: preMatchPhaseState.marker,
      continuous: preMatchPhaseState.continuous,
      interruptPrevious: preMatchPhaseState.interruptPrevious,
    }
    return result
  }

  /**
   * hook of @BlockTokenizerParsePhaseHook
   */
  public parseFlow(
    matchPhaseState: ThematicBreakMatchPhaseState,
  ): ThematicBreakDataNode {
    const result: ThematicBreakDataNode = {
      type: matchPhaseState.type,
    }
    return result
  }
}
