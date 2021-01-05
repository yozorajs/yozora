import type {
  BlockTokenizer,
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseHook,
  BlockTokenizerParsePhaseState,
  EatingLineInfo,
  PhrasingContent,
  PhrasingContentMatchPhaseState,
  ResultOfEatAndInterruptPreviousSibling,
  ResultOfEatOpener,
  ResultOfParse,
  YastBlockNodeType,
} from '@yozora/tokenizercore-block'
import type {
  SetextHeading,
  SetextHeadingMatchPhaseState,
  SetextHeadingMatchPhaseStateData,
  SetextHeadingType as T,
} from './types'
import {
  AsciiCodePoint,
  isUnicodeWhiteSpaceCharacter,
} from '@yozora/character'
import { YastNodePoint } from '@yozora/tokenizercore'
import {
  BaseBlockTokenizer,
  PhrasingContentType,
} from '@yozora/tokenizercore-block'
import { SetextHeadingType } from './types'


/**
 * Lexical Analyzer for SetextHeading
 *
 * A setext heading consists of one or more lines of text, each containing
 * at least one non-whitespace character, with no more than 3 spaces
 * indentation, followed by a setext heading underline. The lines of text must
 * be such that, were they not followed by the setext heading underline, they
 * would be interpreted as a paragraph
 * @see https://github.github.com/gfm/#setext-heading
 */
export class SetextHeadingTokenizer extends BaseBlockTokenizer<T> implements
  BlockTokenizer<T>,
  BlockTokenizerMatchPhaseHook<T, SetextHeadingMatchPhaseStateData>,
  BlockTokenizerParsePhaseHook<T, SetextHeadingMatchPhaseStateData, SetextHeading>
{
  public readonly name = 'SetextHeadingTokenizer'
  public readonly uniqueTypes: T[] = [SetextHeadingType]
  public readonly interruptableTypes: YastBlockNodeType[] = [PhrasingContentType]

  /**
   * hook of @BlockTokenizerMatchPhaseHook
   */
  public eatOpener(): ResultOfEatOpener<T, SetextHeadingMatchPhaseStateData> {
    return null
  }

  /**
   * hook of @BlockTokenizerMatchPhaseHook
   */
  public eatAndInterruptPreviousSibling(
    nodePoints: YastNodePoint[],
    eatingInfo: EatingLineInfo,
    parentState: Readonly<BlockTokenizerMatchPhaseState>,
    previousSiblingState: Readonly<BlockTokenizerMatchPhaseState>,
    extractPhrasingContentMatchPhaseState?: () => PhrasingContentMatchPhaseState | null,
  ): ResultOfEatAndInterruptPreviousSibling<T, SetextHeadingMatchPhaseStateData> {
    if (eatingInfo.isBlankLine || extractPhrasingContentMatchPhaseState == null) return null
    const { startIndex, endIndex, firstNonWhiteSpaceIndex } = eatingInfo

    /**
     * Four spaces is too much
     * @see https://github.github.com/gfm/#example-55
     * @see https://github.github.com/gfm/#example-57
     */
    if (firstNonWhiteSpaceIndex - startIndex >= 4) return null

    let marker: number | null = null, hasPotentialInternalSpace = false
    for (let i = firstNonWhiteSpaceIndex; i < endIndex; ++i) {
      const c = nodePoints[i]
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

    const phrasingContentState: PhrasingContentMatchPhaseState | null =
      extractPhrasingContentMatchPhaseState()
    if (phrasingContentState == null) return null

    const state: SetextHeadingMatchPhaseState = {
      type: SetextHeadingType,
      opening: false,
      saturated: false,
      parent: parentState,
      marker,
      children: [phrasingContentState],
    }
    phrasingContentState.parent = state

    return {
      nextIndex: endIndex,
      state,
      shouldRemovePreviousSibling: true,
    }
  }

  /**
   * hook of @BlockTokenizerMatchPhaseHook
   */
  public couldInterruptPreviousSibling(
    type: YastBlockNodeType,
    priority: number,
  ): boolean {
    if (this.priority < priority) return false
    return this.interruptableTypes.includes(type)
  }

  /**
   * hook of @BlockTokenizerParsePhaseHook
   */
  public parse(
    matchPhaseStateData: SetextHeadingMatchPhaseStateData,
    children?: BlockTokenizerParsePhaseState[],
  ): ResultOfParse<T, SetextHeading> {
    let depth = 1
    switch (matchPhaseStateData.marker) {
      /**
       * The heading is a level 1 heading if '=' characters are used
       */
      case AsciiCodePoint.EQUALS_SIGN:
        depth = 1
        break
      /**
       * The heading is a level 2 heading if '-' characters are used
       */
      case AsciiCodePoint.MINUS_SIGN:
        depth = 2
        break
    }

    const state: SetextHeading = {
      type: matchPhaseStateData.type,
      depth,
      children: children as [PhrasingContent],
    }
    return { classification: 'flow', state }
  }
}
