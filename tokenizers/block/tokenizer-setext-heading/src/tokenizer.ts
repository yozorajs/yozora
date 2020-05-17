import { AsciiCodePoint, isWhiteSpaceCharacter } from '@yozora/character'
import {
  PhrasingContentDataNode,
  PhrasingContentDataNodeType,
  PhrasingContentTokenizerMatchPhaseState,
  PhrasingContentTokenizerPreMatchPhaseState,
} from '@yozora/tokenizer-phrasing-content'
import {
  BaseBlockTokenizer,
  BlockTokenizer,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseHook,
  BlockTokenizerParsePhaseState,
  BlockTokenizerPostMatchPhaseHook,
  BlockTokenizerPreMatchPhaseState,
  BlockTokenizerPreParsePhaseState,
} from '@yozora/tokenizercore-block'
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
  children: [PhrasingContentTokenizerPreMatchPhaseState]
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
    BlockTokenizerPostMatchPhaseHook,
    BlockTokenizerParsePhaseHook<
      T,
      SetextHeadingTokenizerMatchPhaseState,
      SetextHeadingDataNode>
{
  public readonly name = 'SetextHeadingTokenizer'
  public readonly uniqueTypes: T[] = [SetextHeadingDataNodeType]

  /**
   * hook of @BlockTokenizerPostMatchPhaseHook
   */
  public transformMatch(
    matchPhaseStates: Readonly<BlockTokenizerMatchPhaseState[]>,
  ): BlockTokenizerMatchPhaseState[] {
    const results: BlockTokenizerMatchPhaseState[] = []
    for (const matchPhaseState of matchPhaseStates) {
      switch (matchPhaseState.type) {
        case PhrasingContentDataNodeType: {
          const originalPhrasingContent = matchPhaseState as PhrasingContentTokenizerMatchPhaseState

          let firstLineIndex = 0
          for (let lineIndex = 1; lineIndex < originalPhrasingContent.lines.length; ++lineIndex) {
            const line = originalPhrasingContent.lines[lineIndex]
            const { firstNonWhiteSpaceIndex, codePositions } = line
            const endIndex = codePositions.length

            /**
             * Four spaces indent is too much
             * @see https://github.github.com/gfm/#example-55
             */
            if (firstNonWhiteSpaceIndex >= 4) continue

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
              continue
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
            let hasInnerSpaceFlag = false
            for (let j = i; j < endIndex; ++j) {
              c = codePositions[j]
              if (!isWhiteSpaceCharacter(c.codePoint)) {
                hasInnerSpaceFlag = true
                break
              }
            }
            if (hasInnerSpaceFlag) continue

            const childPhrasingContent: PhrasingContentTokenizerMatchPhaseState = {
              ...originalPhrasingContent,
              lines: originalPhrasingContent.lines.slice(firstLineIndex, lineIndex)
            }
            const state: SetextHeadingTokenizerMatchPhaseState = {
              type: SetextHeadingDataNodeType,
              classify: 'flow',
              depth,
              children: [childPhrasingContent],
            }
            results.push(state)
            firstLineIndex = lineIndex + 1
          }
          if (firstLineIndex < originalPhrasingContent.lines.length) {
            const remainPhrasingContent = {
              ...originalPhrasingContent,
              lines: originalPhrasingContent.lines.slice(firstLineIndex, originalPhrasingContent.lines.length)
            }
            results.push(remainPhrasingContent)
          }
          break
        }
        default:
          results.push(matchPhaseState)
      }
    }
    return results
  }

  /**
   * hook of @BlockTokenizerParsePhaseHook
   */
  public parseFlow(
    matchPhaseState: SetextHeadingTokenizerMatchPhaseState,
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
