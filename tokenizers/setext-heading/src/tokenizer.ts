import type { YastNodeType } from '@yozora/tokenizercore'
import type {
  BlockTokenizer,
  TokenizerMatchBlockHook,
  TokenizerParseBlockHook,
  PhrasingContentLine,
  ResultOfEatAndInterruptPreviousSibling,
  ResultOfEatOpener,
  ResultOfParse,
  YastBlockState,
} from '@yozora/tokenizercore-block'
import type {
  SetextHeading as Node,
  SetextHeadingState as State,
  SetextHeadingType as T,
} from './types'
import {
  AsciiCodePoint,
  VirtualCodePoint,
  isUnicodeWhitespaceCharacter,
} from '@yozora/character'
import {
  calcEndYastNodePoint,
  calcStartYastNodePoint,
} from '@yozora/tokenizercore'
import { PhrasingContentType } from '@yozora/tokenizercore-block'
import { SetextHeadingType } from './types'


/**
 * Params for constructing SetextHeadingTokenizer
 */
export interface SetextHeadingTokenizerProps {
  /**
   * Specify an array of YastNode types that can be interrupted by this
   * Tokenizer on match phase.
   */
  readonly interruptableTypes?: YastNodeType[]
}


/**
 * Lexical Analyzer for SetextHeading.
 *
 * A setext heading consists of one or more lines of text, each containing
 * at least one non-whitespace character, with no more than 3 spaces
 * indentation, followed by a setext heading underline. The lines of text must
 * be such that, were they not followed by the setext heading underline, they
 * would be interpreted as a paragraph.
 *
 * @see https://github.github.com/gfm/#setext-heading
 */
export class SetextHeadingTokenizer implements
  BlockTokenizer<T, State>,
  TokenizerMatchBlockHook<T, State>,
  TokenizerParseBlockHook<T, State, Node>
{
  public readonly name: string = SetextHeadingTokenizer.name
  public readonly getContext: BlockTokenizer['getContext'] = () => null

  public readonly isContainerBlock = false
  public readonly interruptableTypes: ReadonlyArray<YastNodeType>
  public readonly recognizedTypes: ReadonlyArray<T> = [SetextHeadingType]

  /* istanbul ignore next */
  public constructor(props: SetextHeadingTokenizerProps = {}) {
    this.interruptableTypes = Array.isArray(props.interruptableTypes)
      ? [...props.interruptableTypes]
      : [PhrasingContentType]
  }

  /**
   * @override
   * @see TokenizerMatchBlockHook
   */
  public eatOpener(): ResultOfEatOpener<T, State> {
    return null
  }

  /**
   * @override
   * @see TokenizerMatchBlockHook
   */
  public eatAndInterruptPreviousSibling(
    line: Readonly<PhrasingContentLine>,
    previousSiblingState: Readonly<YastBlockState>,
  ): ResultOfEatAndInterruptPreviousSibling<T, State> {
    const {
      nodePoints,
      endIndex,
      firstNonWhitespaceIndex,
      countOfPrecedeSpaces,
    } = line

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

    const context = this.getContext()!
    const lines = context.extractPhrasingContentLines(previousSiblingState)
    if (lines == null) return null

    const nextIndex = endIndex
    const state: State = {
      type: SetextHeadingType,
      position: {
        start: calcStartYastNodePoint(lines[0].nodePoints, lines[0].startIndex),
        end: calcEndYastNodePoint(nodePoints, nextIndex - 1),
      },
      marker,
      lines: [...lines],
    }
    return {
      state,
      nextIndex,
      saturated: true,
      remainingSibling: null,
    }
  }

  /**
   * @override
   * @see TokenizerParseBlockHook
   */
  public parse(state: Readonly<State>): ResultOfParse<T, Node> {
    let depth = 1
    switch (state.marker) {
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

    const node: Node = {
      type: state.type,
      depth,
      children: [],
    }

    const context = this.getContext()!
    const phrasingContentState = context.buildPhrasingContentState(state.lines)
    if (phrasingContentState != null) {
      const phrasingContent = context.buildPhrasingContent(phrasingContentState)
      if (phrasingContent != null) {
        node.children.push(phrasingContent)
      }
    }

    return { classification: 'flow', node }
  }
}
