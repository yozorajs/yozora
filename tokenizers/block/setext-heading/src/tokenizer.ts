import {
  AsciiCodePoint,
  isUnicodeWhiteSpaceCharacter,
} from '@yozora/character'
import {
  ParagraphDataNodeType,
  ParagraphMatchPhaseState,
  ParagraphPreMatchPhaseState,
} from '@yozora/tokenizer-paragraph'
import { DataNodeTokenPointDetail } from '@yozora/tokenizercore'
import {
  BaseBlockTokenizer,
  BlockTokenizer,
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseHook,
  BlockTokenizerParsePhaseState,
  BlockTokenizerPreMatchPhaseHook,
  BlockTokenizerPreMatchPhaseState,
  BlockTokenizerPreParsePhaseState,
  EatAndInterruptPreviousSiblingResult,
  EatNewMarkerResult,
  EatingLineInfo,
  PhrasingContentDataNode,
} from '@yozora/tokenizercore-block'
import {
  SetextHeadingDataNode,
  SetextHeadingDataNodeType,
  SetextHeadingMatchPhaseState,
  SetextHeadingPreMatchPhaseState,
} from './types'


type T = SetextHeadingDataNodeType


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
    BlockTokenizerPreMatchPhaseHook<
      T,
      SetextHeadingPreMatchPhaseState>,
    BlockTokenizerMatchPhaseHook<
      T,
      SetextHeadingPreMatchPhaseState,
      SetextHeadingMatchPhaseState>,
    BlockTokenizerParsePhaseHook<
      T,
      SetextHeadingMatchPhaseState,
      SetextHeadingDataNode>
{
  public readonly name = 'SetextHeadingTokenizer'
  public readonly uniqueTypes: T[] = [SetextHeadingDataNodeType]

  /**
   * hook of @BlockTokenizerPreMatchPhaseHook
   */
  public eatNewMarker(
  ): EatNewMarkerResult<T, SetextHeadingPreMatchPhaseState> {
    return null
  }

  /**
   * hook of @BlockTokenizerPreMatchPhaseHook
   */
  public eatAndInterruptPreviousSibling(
    codePositions: DataNodeTokenPointDetail[],
    eatingInfo: EatingLineInfo,
    parentState: Readonly<BlockTokenizerPreMatchPhaseState>,
    previousSiblingState: Readonly<BlockTokenizerPreMatchPhaseState>
  ): EatAndInterruptPreviousSiblingResult<T, SetextHeadingPreMatchPhaseState> {
    if (eatingInfo.isBlankLine) return null
    if (previousSiblingState.type !== ParagraphDataNodeType) return null

    const { startIndex, endIndex, firstNonWhiteSpaceIndex } = eatingInfo

    /**
     * Four spaces is too much
     * @see https://github.github.com/gfm/#example-55
     * @see https://github.github.com/gfm/#example-57
     */
    if (firstNonWhiteSpaceIndex - startIndex >= 4) return null

    let marker: number | null = null, hasPotentialInternalSpace = false
    for (let i = firstNonWhiteSpaceIndex; i < endIndex; ++i) {
      const c = codePositions[i]
      if (c.codePoint == AsciiCodePoint.LINE_FEED) break

      /**
       * The setext heading underline can be indented up to three spaces,
       * and may have trailing spaces
       * @see https://github.github.com/gfm/#example-56
       */
      if (isUnicodeWhiteSpaceCharacter(c.codePoint)) {
        hasPotentialInternalSpace = true
        continue
      }

      /**
       * The setext heading underline cannot contain internal spaces
       * @see https://github.github.com/gfm/#example-58
       *
       * A setext heading underline is a sequence of '=' characters or
       * a sequence of '-' characters
       * @see https://github.github.com/gfm/#setext-heading-underline
       */
      if (
        hasPotentialInternalSpace ||
        (
          c.codePoint !== AsciiCodePoint.EQUALS_SIGN &&
          c.codePoint !== AsciiCodePoint.MINUS_SIGN
        ) ||
        (marker != null && marker !== c.codePoint)
      ) {
        marker = null
        break
      }

      marker = c.codePoint
    }

    // Not a valid setext heading underline
    if (marker == null) return null

    const state: SetextHeadingPreMatchPhaseState = {
      type: SetextHeadingDataNodeType,
      opening: false,
      saturated: false,
      parent: parentState,
      marker,
      children: [previousSiblingState as ParagraphPreMatchPhaseState],
    }

    return {
      nextIndex: endIndex,
      state,
      shouldRemovePreviousSibling: true,
    }
  }

  /**
   * hook of @BlockTokenizerMatchPhaseHook
   */
  public match(
    preMatchPhaseState: SetextHeadingPreMatchPhaseState,
    matchedChildren: BlockTokenizerMatchPhaseState[],
  ): SetextHeadingMatchPhaseState {
    let depth = 1
    switch (preMatchPhaseState.marker) {
      case AsciiCodePoint.EQUALS_SIGN:
        /**
         * The heading is a level 1 heading if '=' characters are used
         */
        depth = 1
        break
      case AsciiCodePoint.MINUS_SIGN:
        /**
         * The heading is a level 2 heading if '-' characters are used
         */
        depth = 2
        break
    }

    const paragraph = matchedChildren[0] as ParagraphMatchPhaseState
    const result: SetextHeadingMatchPhaseState  = {
      type: preMatchPhaseState.type,
      classify: 'flow',
      depth,
      children: paragraph.children,
    }
    return result
  }

  /**
   * hook of @BlockTokenizerParsePhaseHook
   */
  public parseFlow(
    matchPhaseState: SetextHeadingMatchPhaseState,
    preParsePhaseState: BlockTokenizerPreParsePhaseState,
    children?: BlockTokenizerParsePhaseState[],
  ): SetextHeadingDataNode {
    const result: SetextHeadingDataNode = {
      type: matchPhaseState.type,
      depth: matchPhaseState.depth,
      children: children as [PhrasingContentDataNode],
    }
    return result
  }
}
