import type { YastNodeType } from '@yozora/tokenizercore'
import type {
  BlockTokenizer,
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerParsePhaseHook,
  PhrasingContentLine,
  ResultOfEatOpener,
  ResultOfParse,
} from '@yozora/tokenizercore-block'
import type {
  ThematicBreak as Node,
  ThematicBreakState as State,
  ThematicBreakType as T,
} from './types'
import {
  AsciiCodePoint,
  isUnicodeWhitespaceCharacter,
} from '@yozora/character'
import {
  calcEndYastNodePoint,
  calcStartYastNodePoint,
} from '@yozora/tokenizercore'
import { PhrasingContentType } from '@yozora/tokenizercore-block'
import { ThematicBreakType } from './types'


/**
 * Params for constructing ThematicBreakTokenizer
 */
export interface ThematicBreakTokenizerProps {
  /**
   * YastNode types that can be interrupt by this BlockTokenizer.
   */
  readonly interruptableTypes?: YastNodeType[]
}


/**
 * Lexical Analyzer for ThematicBreak.
 *
 * A line consisting of 0-3 spaces of indentation, followed by a sequence of
 * three or more matching -, _, or * characters, each followed optionally by
 * any number of spaces or tabs, forms a thematic break.
 *
 * @see https://github.github.com/gfm/#thematic-break
 */
export class ThematicBreakTokenizer implements
  BlockTokenizer<T, State>,
  BlockTokenizerMatchPhaseHook<T, State>,
  BlockTokenizerParsePhaseHook<T, State, Node>
{
  public readonly name: string = ThematicBreakTokenizer.name
  public readonly getContext: BlockTokenizer['getContext'] = () => null

  public readonly isContainerBlock = false
  public readonly interruptableTypes: ReadonlyArray<YastNodeType>
  public readonly recognizedTypes: ReadonlyArray<T> = [ThematicBreakType]

  /* istanbul ignore next */
  public constructor(props: ThematicBreakTokenizerProps = {}) {
    this.interruptableTypes = Array.isArray(props.interruptableTypes)
      ? [...props.interruptableTypes]
      : [PhrasingContentType]
  }

  /**
   * @override
   * @see BlockTokenizerMatchPhaseHook
   */
  public eatOpener(line: Readonly<PhrasingContentLine>): ResultOfEatOpener<T, State> {
    /**
     * Four spaces is too much
     * @see https://github.github.com/gfm/#example-19
     */
    if (line.countOfPrecedeSpaces >= 4) return null

    const { nodePoints, startIndex, endIndex, firstNonWhitespaceIndex } = line
    if (firstNonWhitespaceIndex >= endIndex) return null

    let marker: number, count = 0
    let continuous = true, hasPotentialInternalSpace = false
    for (let i = firstNonWhitespaceIndex; i < endIndex; ++i) {
      const c = nodePoints[i]

      /**
       * Spaces are allowed between the characters
       * Spaces are allowed at the end
       * @see https://github.github.com/gfm/#example-21
       * @see https://github.github.com/gfm/#example-22
       * @see https://github.github.com/gfm/#example-23
       * @see https://github.github.com/gfm/#example-24
       */
      if (isUnicodeWhitespaceCharacter(c.codePoint)) {
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

    const nextIndex = endIndex
    const state: State = {
      type: ThematicBreakType,
      position: {
        start: calcStartYastNodePoint(nodePoints, startIndex),
        end: calcEndYastNodePoint(nodePoints, nextIndex - 1),
      },
      marker: marker!,
      continuous,
    }
    return { state, nextIndex, saturated: true }
  }

  /**
   * @override
   * @see BlockTokenizerParsePhaseHook
   */
  public parse(state: Readonly<State>): ResultOfParse<T, Node> {
    const node: Node = { type: state.type }
    return { classification: 'flow', node }
  }
}
