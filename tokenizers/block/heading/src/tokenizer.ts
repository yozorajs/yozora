import {
  AsciiCodePoint,
  isUnicodeWhiteSpaceCharacter,
} from '@yozora/character'
import { ParagraphDataNodeType } from '@yozora/tokenizer-paragraph'
import { DataNodeTokenPointDetail } from '@yozora/tokenizercore'
import {
  BaseBlockTokenizer,
  BlockTokenizer,
  BlockTokenizerEatingInfo,
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerParsePhaseHook,
  BlockTokenizerParsePhaseState,
  BlockTokenizerPreMatchPhaseHook,
  BlockTokenizerPreMatchPhaseState,
  BlockTokenizerPreParsePhaseState,
  PhrasingContentDataNode,
  PhrasingContentDataNodeType,
  PhrasingContentLine,
  PhrasingContentMatchPhaseState,
} from '@yozora/tokenizercore-block'
import {
  HeadingDataNode,
  HeadingDataNodeType,
  HeadingMatchPhaseState,
  HeadingPreMatchPhaseState,
} from './types'


type T = HeadingDataNodeType


/**
 * Lexical Analyzer for HeadingDataNode
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
export class HeadingTokenizer extends BaseBlockTokenizer<T>
  implements
    BlockTokenizer<T>,
    BlockTokenizerPreMatchPhaseHook<
      T,
      HeadingPreMatchPhaseState>,
    BlockTokenizerMatchPhaseHook<
      T,
      HeadingPreMatchPhaseState,
      HeadingMatchPhaseState>,
    BlockTokenizerParsePhaseHook<
      T,
      HeadingMatchPhaseState,
      HeadingDataNode>
{
  public readonly name = 'HeadingTokenizer'
  public readonly uniqueTypes: T[] = [HeadingDataNodeType]

  /**
   * hook of @BlockTokenizerPreMatchPhaseHook
   */
  public eatNewMarker(
    codePositions: DataNodeTokenPointDetail[],
    eatingInfo: BlockTokenizerEatingInfo,
    parentState: Readonly<BlockTokenizerPreMatchPhaseState>,
  ): {
    nextIndex: number,
    state: HeadingPreMatchPhaseState,
  } | null {
    if (eatingInfo.isBlankLine) return null
    const { startIndex, firstNonWhiteSpaceIndex, endIndex } = eatingInfo

    /**
     * Four spaces are too much
     * @see https://github.github.com/gfm/#example-39
     * @see https://github.github.com/gfm/#example-40
     */
    if (firstNonWhiteSpaceIndex - startIndex >= 4) return null

    let depth = 0, i = firstNonWhiteSpaceIndex, c = codePositions[i]
    for (; i < endIndex; ++i) {
      c = codePositions[i]
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
      c = codePositions[leftIndex]
      if (!isUnicodeWhiteSpaceCharacter(c.codePoint)) break
    }
    for (; rightIndex > leftIndex; --rightIndex) {
      c = codePositions[rightIndex]
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
      c = codePositions[j]
      if (c.codePoint !== AsciiCodePoint.NUMBER_SIGN) break
      closeCharCount += 1
    }
    if (closeCharCount > 0) {
      let spaceCount = 0, j = rightIndex - closeCharCount
      for (; j >= leftIndex; --j) {
        c = codePositions[j]
        if (!isUnicodeWhiteSpaceCharacter(c.codePoint)) break
        spaceCount += 1
      }
      if (spaceCount > 0 || j < leftIndex) {
        rightIndex -= closeCharCount + spaceCount
      }
    }

    const line: PhrasingContentLine = {
      codePositions: codePositions.slice(leftIndex, rightIndex + 1),
      firstNonWhiteSpaceIndex: 0,
    }
    const state: HeadingPreMatchPhaseState = {
      type: HeadingDataNodeType,
      opening: true,
      parent: parentState,
      depth,
      lines: [line],
    }
    return { nextIndex: endIndex, state }
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
    state: HeadingPreMatchPhaseState,
    shouldRemovePreviousSibling: boolean,
  } | null {
    const self = this
    switch (previousSiblingState.type) {
      /**
       * ATX headings need not be separated from surrounding content by blank
       * lines, and they can interrupt paragraphs
       * @see https://github.github.com/gfm/#example-47
       * @see https://github.github.com/gfm/#example-48
       */
      case ParagraphDataNodeType: {
        const eatingResult = self.eatNewMarker(codePositions, eatingInfo, parentState)
        if (eatingResult == null) return null
        return { ...eatingResult, shouldRemovePreviousSibling: false }
      }
      default:
        return null
    }
  }

  /**
   * hook of @BlockTokenizerMatchPhaseHook
   */
  public match(
    preMatchPhaseState: HeadingPreMatchPhaseState,
  ): HeadingMatchPhaseState {
    const phrasingContent: PhrasingContentMatchPhaseState = {
      type: PhrasingContentDataNodeType,
      classify: 'flow',
      lines: preMatchPhaseState.lines,
    }
    const result: HeadingMatchPhaseState = {
      type: preMatchPhaseState.type,
      classify: 'flow',
      depth: preMatchPhaseState.depth,
      children: [phrasingContent],
    }
    return result
  }

  /**
   * hook of @BlockTokenizerParsePhaseHook
   */
  public parseFlow(
    matchPhaseState: HeadingMatchPhaseState,
    preParsePhaseState: BlockTokenizerPreParsePhaseState,
    children?: BlockTokenizerParsePhaseState[],
  ): HeadingDataNode {
    const result: HeadingDataNode = {
      type: matchPhaseState.type,
      depth: matchPhaseState.depth,
    }

    // ignore blank contents
    if (children != null && children.length > 0) {
      result.children = children as [PhrasingContentDataNode]
    }
    return result
  }
}
