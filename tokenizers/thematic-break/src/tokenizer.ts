import type { EnhancedYastNodePoint } from '@yozora/tokenizercore'
import type {
  BlockTokenizer,
  BlockTokenizerMatchPhaseHook,
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
  ThematicBreakPostMatchPhaseState as PMS,
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
 * Params for constructing ThematicBreakTokenizer
 */
export interface ThematicBreakTokenizerProps extends BlockTokenizerProps {

}


/**
 * Lexical Analyzer for ThematicBreak
 *
 * A line consisting of 0-3 spaces of indentation, followed by a sequence of
 * three or more matching -, _, or * characters, each followed optionally by
 * any number of spaces or tabs, forms a thematic break
 * @see https://github.github.com/gfm/#thematic-break
 */
export class ThematicBreakTokenizer extends BaseBlockTokenizer<T, MS, PMS> implements
  BlockTokenizer<T, MS, PMS>,
  BlockTokenizerMatchPhaseHook<T, MS>,
  BlockTokenizerParsePhaseHook<T, PMS, PS> {

  public readonly name = 'ThematicBreakTokenizer'
  public readonly uniqueTypes: T[] = [ThematicBreakType]

  public constructor(props: ThematicBreakTokenizerProps = {}) {
    super({
      ...props,
      interruptableTypes: props.interruptableTypes || [PhrasingContentType],
    })
  }

  /**
   * @override
   * @see BlockTokenizerMatchPhaseHook
   */
  public eatOpener(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    eatingInfo: EatingLineInfo,
  ): ResultOfEatOpener<T, MS> {
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
      marker: marker!,
      continuous,
    }
    return { state, nextIndex: endIndex, saturated: true }
  }

  /**
   * @override
   * @see BlockTokenizerMatchPhaseHook
   */
  public eatAndInterruptPreviousSibling(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    eatingInfo: EatingLineInfo,
  ): ResultOfEatAndInterruptPreviousSibling<T, MS> {
    const result = this.eatOpener(nodePoints, eatingInfo)
    if (result == null) return null

    /**
     * If a line of dashes that meets the above conditions for being a
     * thematic break could also be interpreted as the underline of a
     * setext heading, the interpretation as a setext heading takes
     * precedence. Thus, for example, this is a setext heading, not a
     * paragraph followed by a thematic break
     *
     * It's okay to ignore this rule, just make sure the following conditions are met:
     *
     *    SetextHeadingTokenizer.priority > ThematicBreakTokenizer.priority
     *
     * @see https://github.github.com/gfm/#setext-heading-underline
     * @see https://github.github.com/gfm/#example-29
     */
    // if (
    //   result.state.continuous &&
    //   result.state.marker === AsciiCodePoint.MINUS_SIGN
    // ) return null

    return result
  }

  /**
   * @override
   * @see BlockTokenizerParsePhaseHook
   */
  public parse(postMatchState: Readonly<PMS>): ResultOfParse<T, PS> {
    const state: PS = { type: postMatchState.type }
    return { classification: 'flow', state }
  }
}
