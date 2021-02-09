import type { NodePoint } from '@yozora/character'
import type { YastNodeType } from '@yozora/tokenizercore'
import type {
  BlockTokenizer,
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseHook,
  EatingLineInfo,
  ResultOfEatAndInterruptPreviousSibling,
  ResultOfEatOpener,
  ResultOfParse,
} from '@yozora/tokenizercore-block'
import type {
  SetextHeading as PS,
  SetextHeadingMatchPhaseState as MS,
  SetextHeadingPostMatchPhaseState as PMS,
  SetextHeadingType as T,
} from './types'
import {
  AsciiCodePoint,
  VirtualCodePoint,
  isUnicodeWhitespaceCharacter,
} from '@yozora/character'
import { PhrasingContentType } from '@yozora/tokenizercore-block'
import { SetextHeadingType } from './types'


/**
 * Params for constructing SetextHeadingTokenizer
 */
export interface SetextHeadingTokenizerProps {
  /**
   * YastNode types that can be interrupt by this BlockTokenizer.
   */
  readonly interruptableTypes?: YastNodeType[]
}


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
export class SetextHeadingTokenizer implements
  BlockTokenizer<T, MS, PMS>,
  BlockTokenizerMatchPhaseHook<T, MS>,
  BlockTokenizerParsePhaseHook<T, PMS, PS>
{
  public readonly name = 'SetextHeadingTokenizer'
  public readonly getContext: BlockTokenizer['getContext'] = () => null

  public readonly isContainerBlock = false
  public readonly recognizedTypes: ReadonlyArray<T> = [SetextHeadingType]
  public readonly interruptableTypes: ReadonlyArray<YastNodeType>

  public constructor(props: SetextHeadingTokenizerProps = {}) {
    this.interruptableTypes = Array.isArray(props.interruptableTypes)
      ? [...props.interruptableTypes]
      : [PhrasingContentType]
  }

  /**
   * @override
   * @see BlockTokenizerMatchPhaseHook
   */
  public eatOpener(): ResultOfEatOpener<T, MS> {
    return null
  }

  /**
   * @override
   * @see BlockTokenizerMatchPhaseHook
   */
  public eatAndInterruptPreviousSibling(
    nodePoints: ReadonlyArray<NodePoint>,
    eatingInfo: EatingLineInfo,
    previousSiblingState: Readonly<BlockTokenizerMatchPhaseState>,
  ): ResultOfEatAndInterruptPreviousSibling<T, MS> {
    const {
      endIndex,
      firstNonWhitespaceIndex,
      countOfPrecedeSpaces,
    } = eatingInfo

    /**
     * Four spaces is too much
     * @see https://github.github.com/gfm/#example-55
     * @see https://github.github.com/gfm/#example-57
     */
    if (
      countOfPrecedeSpaces >= 4 ||
      firstNonWhitespaceIndex >= endIndex
    ) return null

    let marker: number | null = null, hasPotentialInternalSpace = false
    for (let i = firstNonWhitespaceIndex; i < endIndex; ++i) {
      const c = nodePoints[i]
      if (c.codePoint == VirtualCodePoint.LINE_END) break

      /**
       * The setext heading underline can be indented up to three spaces,
       * and may have trailing spaces
       * @see https://github.github.com/gfm/#example-56
       */
      if (isUnicodeWhitespaceCharacter(c.codePoint)) {
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

    const context = this.getContext()
    if (context == null) return null

    const lines = context.extractPhrasingContentLines(previousSiblingState)
    if (lines == null) return null

    const state: MS = {
      type: SetextHeadingType,
      marker,
      lines: lines,
    }
    return {
      state,
      nextIndex: endIndex,
      saturated: true,
      shouldRemovePreviousSibling: true,
    }
  }

  /**
   * @override
   * @see BlockTokenizerParsePhaseHook
   */
  public parse(
    nodePoints: ReadonlyArray<NodePoint>,
    postMatchState: Readonly<PMS>,
  ): ResultOfParse<T, PS> {
    const context = this.getContext()
    if (context == null) return null

    // Try to build phrasingContent
    const phrasingContent = context
      .buildPhrasingContentParsePhaseState(nodePoints, postMatchState.lines)
    if (phrasingContent == null) return null

    let depth = 1
    switch (postMatchState.marker) {
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

    const state: PS = {
      type: postMatchState.type,
      depth,
      children: [phrasingContent],
    }
    return { classification: 'flow', state }
  }
}
