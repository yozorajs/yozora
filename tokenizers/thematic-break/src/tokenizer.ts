import type { EnhancedYastNodePoint } from '@yozora/tokenizercore'
import type {
  BlockTokenizer,
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseHook,
  BlockTokenizerProps,
  EatingLineInfo,
  ResultOfEatAndInterruptPreviousSibling,
  ResultOfEatOpener,
  ResultOfParse,
} from '@yozora/tokenizercore-block'
import type {
  ThematicBreak as PS,
  ThematicBreakMatchPhaseState as MS,
  ThematicBreakMatchPhaseStateData as MSD,
  ThematicBreakType as T,
} from './types'
import {
  AsciiCodePoint,
  isUnicodeWhiteSpaceCharacter,
} from '@yozora/character'
import {
  BaseBlockTokenizer,
  PhrasingContentType,
} from '@yozora/tokenizercore-block'
import { ThematicBreakType } from './types'


/**
 * Lexical Analyzer for ThematicBreak
 *
 * A line consisting of 0-3 spaces of indentation, followed by a sequence of
 * three or more matching -, _, or * characters, each followed optionally by
 * any number of spaces or tabs, forms a thematic break
 * @see https://github.github.com/gfm/#thematic-break
 */
export class ThematicBreakTokenizer extends BaseBlockTokenizer<T> implements
  BlockTokenizer<T>,
  BlockTokenizerMatchPhaseHook<T, MSD>,
  BlockTokenizerParsePhaseHook<T, MSD, PS> {

  public readonly name = 'ThematicBreakTokenizer'
  public readonly uniqueTypes: T[] = [ThematicBreakType]

  public constructor(props: BlockTokenizerProps) {
    super({
      ...props,
      interruptableTypes: props.interruptableTypes || [PhrasingContentType],
    })
  }

  /**
   * hook of @BlockTokenizerMatchPhaseHook
   */
  public eatOpener(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    eatingInfo: EatingLineInfo,
    parentState: Readonly<BlockTokenizerMatchPhaseState>,
  ): ResultOfEatOpener<T, MSD> {
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
      const c = nodePoints[i]

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

    const state: MS = {
      type: ThematicBreakType,
      opening: true,
      saturated: true,
      parent: parentState,
      marker: marker!,
      continuous,
      interruptPrevious: false,
    }
    return { state, nextIndex: endIndex }
  }

  /**
   * hook of @BlockTokenizerMatchPhaseHook
   */
  public eatAndInterruptPreviousSibling(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    eatingInfo: EatingLineInfo,
    parentState: Readonly<BlockTokenizerMatchPhaseState>,
  ): ResultOfEatAndInterruptPreviousSibling<T, MSD> {
    const eatingResult = this.eatOpener(nodePoints, eatingInfo, parentState)
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
      state: {
        ...eatingResult.state,
        interruptPrevious: true,
      },
      nextIndex: eatingResult.nextIndex,
      shouldRemovePreviousSibling: false
    }
  }

  /**
   * hook of @BlockTokenizerParsePhaseHook
   */
  public parse(matchPhaseStateData: MSD): ResultOfParse<T, PS> {
    const state: PS = {
      type: matchPhaseStateData.type,
    }
    return { classification: 'flow', state }
  }
}
