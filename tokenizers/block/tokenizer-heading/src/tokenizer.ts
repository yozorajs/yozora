import {
  BaseBlockDataNodeTokenizer,
  BlockDataNode,
  BlockDataNodeEatingLineInfo,
  BlockDataNodeEatingResult,
  BlockDataNodeMatchResult,
  BlockDataNodeMatchState,
  BlockDataNodeTokenizer,
  DataNodeTokenPointDetail,
  InlineDataNodeParseFunc,
  CodePoint,
  isUnicodeWhiteSpace,
} from '@yozora/tokenizer-core'
import {
  HeadingDataNode,
  HeadingDataNodeData,
  HeadingDataNodeType,
} from './types'


type T = HeadingDataNodeType


export interface HeadingDataNodeMatchState extends BlockDataNodeMatchState<T> {
  depth: number
  content: DataNodeTokenPointDetail[]
}


export interface HeadingDataNodeMatchResult extends BlockDataNodeMatchResult<T> {
  depth: number
  content: DataNodeTokenPointDetail[]
}


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
export class HeadingTokenizer extends BaseBlockDataNodeTokenizer<
  T,
  HeadingDataNodeData,
  HeadingDataNodeMatchState,
  HeadingDataNodeMatchResult>
  implements BlockDataNodeTokenizer<
  T,
  HeadingDataNodeData,
  HeadingDataNodeMatchState,
  HeadingDataNodeMatchResult> {
  public readonly name = 'HeadingTokenizer'
  public readonly recognizedTypes: T[] = [HeadingDataNodeType]

  /**
   * override
   */
  public eatNewMarker(
    codePoints: DataNodeTokenPointDetail[],
    eatingLineInfo: BlockDataNodeEatingLineInfo,
    parentState: BlockDataNodeMatchState,
  ): BlockDataNodeEatingResult<T, HeadingDataNodeMatchState> | null {
    if (eatingLineInfo.isBlankLine) return null
    const { startIndex, firstNonWhiteSpaceIndex, endIndex } = eatingLineInfo

    /**
     * Four spaces are too much
     * @see https://github.github.com/gfm/#example-39
     * @see https://github.github.com/gfm/#example-40
     */
    if (firstNonWhiteSpaceIndex - startIndex >= 4) return null

    let depth = 0, i = firstNonWhiteSpaceIndex, c = codePoints[i]
    for (; i < endIndex; ++i) {
      c = codePoints[i]
      if (c.codePoint !== CodePoint.NUMBER_SIGN) break
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
    if (i + 1 < endIndex && c.codePoint !== CodePoint.SPACE) return null

    /**
     * Leading and trailing whitespace is ignored in parsing inline content
     * Spaces are allowed after the closing sequence
     * @see https://github.github.com/gfm/#example-37
     * @see https://github.github.com/gfm/#example-43
     */
    let leftIndex = i + 1, rightIndex = endIndex - 1
    for (; leftIndex < endIndex; ++leftIndex) {
      c = codePoints[leftIndex]
      if (!isUnicodeWhiteSpace(c.codePoint)) break
    }
    for (; rightIndex > leftIndex; --rightIndex) {
      c = codePoints[rightIndex]
      if (!isUnicodeWhiteSpace(c.codePoint)) break
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
      c = codePoints[j]
      if (c.codePoint !== CodePoint.NUMBER_SIGN) break
      closeCharCount += 1
    }
    if (closeCharCount > 0) {
      let spaceCount = 0, j = rightIndex - closeCharCount
      for (; j >= leftIndex; --j) {
        c = codePoints[j]
        if (!isUnicodeWhiteSpace(c.codePoint)) break
        spaceCount += 1
      }
      if (spaceCount > 0 || j < leftIndex) {
        rightIndex -= closeCharCount + spaceCount
      }
    }

    const state: HeadingDataNodeMatchState = {
      type: HeadingDataNodeType,
      opening: true,
      parent: parentState,
      depth,
      content: codePoints.slice(leftIndex, rightIndex + 1),
    }
    return { nextIndex: endIndex, state }
  }

  /**
   * override
   */
  public eatContinuationText(): null {
    return null
  }

  /**
   * override
   */
  public match(state: HeadingDataNodeMatchState): HeadingDataNodeMatchResult {
    const result: HeadingDataNodeMatchResult = {
      type: state.type,
      depth: state.depth,
      content: state.content,
    }
    return result
  }

  /**
   * override
   */
  public parse(
    codePoints: DataNodeTokenPointDetail[],
    matchResult: HeadingDataNodeMatchResult,
    children?: BlockDataNode[],
    parseInline?: InlineDataNodeParseFunc,
  ): HeadingDataNode {
    const result: HeadingDataNode = {
      type: matchResult.type,
      data: {
        depth: matchResult.depth,
        children: [],
      }
    }
    if (parseInline != null) {
      const innerData = parseInline(matchResult.content, 0, matchResult.content.length)
      result.data!.children = innerData
    }
    return result
  }

  // /**
  //  * override
  //  */
  // public shouldAcceptChild(
  //   state: HeadingListDataNodeMatchState,
  //   childState: BlockDataNodeMatchState,
  // ): boolean {
  //   return false
  // }

  // /**
  //  * override
  //  */
  // public beforeAcceptChild(state: HeadingDataNodeMatchState): void {
  //
  // }

  // /**
  //  * override
  //  */
  // public beforeCloseMatchState(state: HeadingDataNodeMatchState): void {
  //
  // }
}
