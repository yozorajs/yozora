import type { YastNodePoint } from '@yozora/tokenizercore'
import type {
  BlockTokenizer,
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseHook,
  EatingLineInfo,
  PhrasingContent,
  PhrasingContentLine,
  PhrasingContentMatchPhaseState,
  ResultOfEatOpener,
  ResultOfParse,
  YastBlockNodeType,
} from '@yozora/tokenizercore-block'
import type {
  Heading,
  HeadingMatchPhaseState,
  HeadingMatchPhaseStateData,
  HeadingType as T,
} from './types'
import {
  AsciiCodePoint,
  isUnicodeWhiteSpaceCharacter,
} from '@yozora/character'
import {
  BaseBlockTokenizer,
  PhrasingContentType,
  mergeContentLines,
} from '@yozora/tokenizercore-block'
import { HeadingType } from './types'


/**
 * Lexical Analyzer for Heading
 *
 * An ATX heading consists of a string of characters, parsed as inline content,
 * between an opening sequence of 1–6 unescaped '#' characters and an optional
 * closing sequence of any number of unescaped '#' characters. The opening
 * sequence of '#' characters must be followed by a space or by the end of line.
 * The optional closing sequence of #s must be preceded by a space and may be
 * followed by spaces only. The opening # character may be indented 0-3 spaces.
 * The raw contents of the heading are stripped of leading and trailing spaces
 * before being parsed as inline content. The heading level is equal to the
 * number of '#' characters in the opening sequence.
 */
export class HeadingTokenizer extends BaseBlockTokenizer<T> implements
  BlockTokenizer<T>,
  BlockTokenizerMatchPhaseHook<T, HeadingMatchPhaseStateData>,
  BlockTokenizerParsePhaseHook<T, HeadingMatchPhaseStateData, Heading>
{
  public readonly name = 'HeadingTokenizer'
  public readonly uniqueTypes: T[] = [HeadingType]
  public readonly interruptableTypes: YastBlockNodeType[] = [PhrasingContentType]

  /**
   * hook of @BlockTokenizerMatchPhaseHook
   */
  public eatOpener(
    nodePoints: YastNodePoint[],
    eatingInfo: EatingLineInfo,
    parentState: Readonly<BlockTokenizerMatchPhaseState>,
  ): ResultOfEatOpener<T, HeadingMatchPhaseStateData> {
    if (eatingInfo.isBlankLine) return null
    const { startIndex, firstNonWhiteSpaceIndex, endIndex } = eatingInfo

    /**
     * Four spaces are too much
     * @see https://github.github.com/gfm/#example-39
     * @see https://github.github.com/gfm/#example-40
     */
    if (firstNonWhiteSpaceIndex - startIndex >= 4) return null

    let depth = 0, i = firstNonWhiteSpaceIndex, c = nodePoints[i]
    for (; i < endIndex; ++i) {
      c = nodePoints[i]
      if (c.codePoint !== AsciiCodePoint.NUMBER_SIGN) break
      depth += 1
    }

    /**
     * More than six '#' characters is not a heading
     * @see https://github.github.com/gfm/#example-33
     */
    if (depth < 1 || depth > 6) return null

    /**
     * At least one space is required between the '#' characters and the
     * heading’s contents, unless the heading is empty. Note that many
     * implementations currently do not require the space. However, the space
     * was required by the original ATX implementation, and it helps prevent
     * things like the following from being parsed as headings:
     *
     * ATX headings can be empty
     * @see https://github.github.com/gfm/#example-49
     */
    if (i + 1 < endIndex && c.codePoint !== AsciiCodePoint.SPACE) return null

    /**
     * Leading and trailing whitespace is ignored in parsing inline content
     * Spaces are allowed after the closing sequence
     * @see https://github.github.com/gfm/#example-37
     * @see https://github.github.com/gfm/#example-43
     */
    let leftIndex = i + 1, rightIndex = endIndex - 1
    for (; leftIndex < endIndex; ++leftIndex) {
      c = nodePoints[leftIndex]
      if (!isUnicodeWhiteSpaceCharacter(c.codePoint)) break
    }
    for (; rightIndex > leftIndex; --rightIndex) {
      c = nodePoints[rightIndex]
      if (!isUnicodeWhiteSpaceCharacter(c.codePoint)) break
    }

    /**
     * A closing sequence of '#' characters is optional
     * It need not be the same length as the opening sequence
     * @see https://github.github.com/gfm/#example-41
     * @see https://github.github.com/gfm/#example-42
     * @see https://github.github.com/gfm/#example-44
     */
    let closeCharCount = 0
    for (let j = rightIndex; j >= leftIndex; --j) {
      c = nodePoints[j]
      if (c.codePoint !== AsciiCodePoint.NUMBER_SIGN) break
      closeCharCount += 1
    }
    if (closeCharCount > 0) {
      let spaceCount = 0, j = rightIndex - closeCharCount
      for (; j >= leftIndex; --j) {
        c = nodePoints[j]
        if (!isUnicodeWhiteSpaceCharacter(c.codePoint)) break
        spaceCount += 1
      }
      if (spaceCount > 0 || j < leftIndex) {
        rightIndex -= closeCharCount + spaceCount
      }
    }

    const line: PhrasingContentLine = {
      nodePoints: nodePoints.slice(leftIndex, rightIndex + 1),
      firstNonWhiteSpaceIndex: 0,
    }
    const state: HeadingMatchPhaseState = {
      type: HeadingType,
      opening: true,
      saturated: true,
      parent: parentState,
      depth,
      lines: [line],
    }
    return { nextIndex: endIndex, state }
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
   * hook of @BlockTokenizerMatchPhaseHook
   */
  public extractPhrasingContentMatchPhaseState(
    state: Readonly<HeadingMatchPhaseState>,
  ): PhrasingContentMatchPhaseState | null {
    return {
      type: PhrasingContentType,
      opening: state.opening,
      saturated: state.saturated,
      parent: state.parent,
      lines: state.lines,
    }
  }

  /**
   * hook of @BlockTokenizerParsePhaseHook
   */
  public parse(
    matchPhaseStateData: HeadingMatchPhaseStateData,
  ): ResultOfParse<T, Heading> {
    const state: Heading = {
      type: matchPhaseStateData.type,
      depth: matchPhaseStateData.depth,
      children: [],
    }

    const contents = mergeContentLines(matchPhaseStateData.lines)
    if (contents.length > 0) {
      const phrasingContent: PhrasingContent = {
        type: PhrasingContentType,
        contents,
      }
      state.children.push(phrasingContent)
    }

    return { classification: 'flow', state }
  }
}
