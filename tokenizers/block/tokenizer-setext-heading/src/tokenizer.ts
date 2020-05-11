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
} from '@yozora/block-tokenizer-core'
import { AsciiCodePoint, isWhiteSpaceCharacter } from '@yozora/character'
import {
  ParagraphDataNodeType,
  ParagraphTokenizerPreMatchPhaseState,
} from '@yozora/tokenizer-paragraph'
import {
  DataNodeTokenPointDetail,
  calcTrimBoundaryOfCodePoints,
} from '@yozora/tokenizercore'
import { SetextHeadingDataNode, SetextHeadingDataNodeType } from './types'


type T = SetextHeadingDataNodeType


/**
 * State of pre-match phase of SetextHeadingTokenizer
 */
export interface SetextHeadingTokenizerPreMatchPhaseState
  extends BlockTokenizerPreMatchPhaseState<T> {
  /**
   * Level of heading
   */
  depth: number
  /**
   * Contents of heading
   */
  content: DataNodeTokenPointDetail[]
}


/**
 * State of match phase of SetextHeadingTokenizer
 */
export interface SetextHeadingTokenizerMatchPhaseState
  extends BlockTokenizerMatchPhaseState<T> {
  /**
   * Level of heading
   */
  depth: number
  /**
   * Contents of heading
   */
  content: DataNodeTokenPointDetail[]
}


/**
 * Lexical Analyzer for SetextHeadingDataNode
 *
 * A setext heading consists of one or more lines of text, each containing
 * at least one non-whitespace character, with no more than 3 spaces
 * indentation, followed by a setext heading underline. The lines of text must
 * be such that, were they not followed by the setext heading underline, they
 * would be interpreted as a paragraph
 * @see https://github.github.com/gfm/#setext-heading
 */
export class SetextHeadingTokenizer extends BaseBlockTokenizer<T>
  implements
    BlockTokenizer<T>,
    BlockTokenizerPreMatchPhaseHook<T, SetextHeadingTokenizerPreMatchPhaseState>,
    BlockTokenizerMatchPhaseHook<T, SetextHeadingTokenizerPreMatchPhaseState, SetextHeadingTokenizerMatchPhaseState>,
    BlockTokenizerParsePhaseHook<T, SetextHeadingTokenizerMatchPhaseState, SetextHeadingDataNode>
{
  public readonly name = 'SetextHeadingTokenizer'
  public readonly uniqueTypes: T[] = [SetextHeadingDataNodeType]

  /**
   * hook of @BlockTokenizerPreMatchPhaseHook
   */
  public eatNewMarker(): null {
    return null
  }

  /**
   * hook of @BlockTokenizerPreMatchPhaseHook
   */
  public eatAndInterruptPreviousSibling(
    codePositions: DataNodeTokenPointDetail[],
    eatingInfo: BlockTokenizerEatingInfo,
    parentState: Readonly<BlockTokenizerPreMatchPhaseState>,
    previousSiblingState: Readonly<BlockTokenizerPreMatchPhaseState>,
  ): {
    nextIndex: number,
    state: SetextHeadingTokenizerPreMatchPhaseState,
    shouldRemovePreviousSibling: boolean,
  } | null {
    if (eatingInfo.isBlankLine) return null
    const { startIndex, firstNonWhiteSpaceIndex, endIndex } = eatingInfo

    switch (previousSiblingState.type) {
      /**
       * The lines of text must be such that, were they not followed by the
       * setext heading underline, they would be interpreted as a paragraph
       */
      case ParagraphDataNodeType: {
        /**
         * Four spaces indent is too much
         * @see https://github.github.com/gfm/#example-55
         */
        if (firstNonWhiteSpaceIndex - startIndex >= 4) return null

        let i = firstNonWhiteSpaceIndex, c = codePositions[i], depth = -1
        if (c.codePoint === AsciiCodePoint.EQUALS_SIGN) {
          /**
           * The heading is a level 1 heading if '=' characters are used
           */
          depth = 1
        } else if (c.codePoint === AsciiCodePoint.MINUS_SIGN) {
          /**
           * The heading is a level 2 heading if '-' characters are used
           */
          depth = 2
        } else {
          /**
           * A setext heading underline is a sequence of '=' characters or a sequence
           * of '-' characters, with no more than 3 spaces indentation and any number
           * of trailing spaces. If a line containing a single '-' can be interpreted
           * as an empty list items, it should be interpreted this way and not as a
           * setext heading underline.
           */
          return null
        }

        for (++i; i < endIndex; ++i) {
          c = codePositions[i]
          if (c.codePoint === AsciiCodePoint.EQUALS_SIGN) continue
          if (c.codePoint === AsciiCodePoint.MINUS_SIGN) continue
          break
        }

        /**
         * The setext heading underline can be indented up to three spaces,
         * and may have trailing spaces
         * The setext heading underline cannot contain internal spaces
         * @see https://github.github.com/gfm/#example-58
         */
        for (let j = i; j < endIndex; ++j) {
          c = codePositions[j]
          if (!isWhiteSpaceCharacter(c.codePoint)) return null
        }

        const paragraph = previousSiblingState as ParagraphTokenizerPreMatchPhaseState
        const state: SetextHeadingTokenizerPreMatchPhaseState = {
          type: SetextHeadingDataNodeType,
          opening: true,
          parent: parentState,
          depth,
          content: paragraph.content,
        }
        return { nextIndex: endIndex, state, shouldRemovePreviousSibling: true }
      }
      default:
        return null
    }
  }

  /**
   * hook of @BlockTokenizerMatchPhaseHook
   */
  public match(
    preMatchPhaseState: SetextHeadingTokenizerPreMatchPhaseState,
  ): SetextHeadingTokenizerMatchPhaseState {
    /**
     * Trailing spaces in the content line do not cause a line break
     * @see https://github.github.com/gfm/#example-59
     */
    let content = preMatchPhaseState.content
    const [leftIndex, rightIndex] = calcTrimBoundaryOfCodePoints(content)
    if (rightIndex - leftIndex < content.length) {
      // eslint-disable-next-line no-param-reassign
      content = content.slice(leftIndex, rightIndex)
    }

    const result: SetextHeadingTokenizerMatchPhaseState = {
      type: preMatchPhaseState.type,
      classify: 'flow',
      depth: preMatchPhaseState.depth,
      content,
    }
    return result
  }

  /**
   * hook of @BlockTokenizerParseFlowPhaseHook
   */
  public parseFlow(
    matchPhaseState: SetextHeadingTokenizerMatchPhaseState,
    preParsePhaseState: BlockTokenizerPreParsePhaseState,
  ): SetextHeadingDataNode {
    const self = this
    const result: SetextHeadingDataNode = {
      type: matchPhaseState.type,
      data: {
        depth: matchPhaseState.depth,
        children: [],
      }
    }
    if (self.parseInlineData != null) {
      const innerData = self.parseInlineData(
        matchPhaseState.content, 0, matchPhaseState.content.length, preParsePhaseState.meta)
      result.data!.children = innerData
    }
    return result
  }
}
