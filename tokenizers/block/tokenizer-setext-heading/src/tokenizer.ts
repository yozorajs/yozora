import {
  BaseBlockDataNodeTokenizer,
  BlockDataNode,
  BlockDataNodeEatingLineInfo,
  BlockDataNodeEatingResult,
  BlockDataNodeMatchResult,
  BlockDataNodeMatchState,
  BlockDataNodeTokenizer,
  CodePoint,
  DataNodeTokenPointDetail,
  InlineDataNodeParseFunc,
  calcTrimBoundaryOfCodePoints,
  isUnicodeWhiteSpace,
} from '@yozora/tokenizer-core'
import {
  ParagraphDataNodeMatchState,
  ParagraphDataNodeType,
} from '@yozora/tokenizer-paragraph'
import {
  SetextHeadingDataNode,
  SetextHeadingDataNodeData,
  SetextHeadingDataNodeType,
} from './types'


type T = SetextHeadingDataNodeType


export interface SetextHeadingDataNodeMatchState extends BlockDataNodeMatchState<T> {
  depth: number
  content: DataNodeTokenPointDetail[]
}


export interface SetextHeadingDataNodeMatchResult extends BlockDataNodeMatchResult<T> {
  depth: number
  content: DataNodeTokenPointDetail[]
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
export class SetextHeadingTokenizer extends BaseBlockDataNodeTokenizer<
  T,
  SetextHeadingDataNodeData,
  SetextHeadingDataNodeMatchState,
  SetextHeadingDataNodeMatchResult>
  implements BlockDataNodeTokenizer<
  T,
  SetextHeadingDataNodeData,
  SetextHeadingDataNodeMatchState,
  SetextHeadingDataNodeMatchResult> {
  public readonly name = 'SetextHeadingTokenizer'
  public readonly recognizedTypes: T[] = [SetextHeadingDataNodeType]

  /**
   * override
   */
  public eatNewMarker(
    codePoints: DataNodeTokenPointDetail[],
    eatingLineInfo: BlockDataNodeEatingLineInfo,
    parentState: BlockDataNodeMatchState,
  ): BlockDataNodeEatingResult<T, SetextHeadingDataNodeMatchState> | null {
    if (eatingLineInfo.isBlankLine) return null
    const { startIndex, firstNonWhiteSpaceIndex, endIndex } = eatingLineInfo

    /**
     * Four spaces indent is too much
     * @see https://github.github.com/gfm/#example-55
     */
    if (firstNonWhiteSpaceIndex - startIndex >= 4) return null

    /**
     * The lines of text must be such that, were they not followed by the
     * setext heading underline, they would be interpreted as a paragraph
     */
    if (parentState.children!.length <= 0) return null
    const previousSiblingNode = parentState.children![parentState.children!.length - 1]
    if (!previousSiblingNode.opening) return null
    if (previousSiblingNode.type !== ParagraphDataNodeType) return null

    let i = firstNonWhiteSpaceIndex, c = codePoints[i], depth = -1
    if (c.codePoint === CodePoint.EQUALS_SIGN) {
      /**
       * The heading is a level 1 heading if '=' characters are used
       */
      depth = 1
    } else if (c.codePoint === CodePoint.HYPHEN) {
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
      return null
    }

    for (++i; i < endIndex; ++i) {
      c = codePoints[i]
      if (c.codePoint === CodePoint.EQUALS_SIGN) continue
      if (c.codePoint === CodePoint.HYPHEN) continue
      break
    }

    /**
     * The setext heading underline cannot contain internal spaces
     */
    for (let j = i; j < endIndex; ++j) {
      c = codePoints[j]
      if (!isUnicodeWhiteSpace(c.codePoint)) return null
    }

    const paragraph = parentState.children!.pop() as ParagraphDataNodeMatchState
    const state: SetextHeadingDataNodeMatchState = {
      type: SetextHeadingDataNodeType,
      opening: true,
      parent: parentState,
      depth,
      content: paragraph.content,
    }
    return { nextIndex: endIndex, state }
  }

  /**
   * override
   */
  public match(state: SetextHeadingDataNodeMatchState): SetextHeadingDataNodeMatchResult {
    const result: SetextHeadingDataNodeMatchResult = {
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
    matchResult: SetextHeadingDataNodeMatchResult,
    children?: BlockDataNode[],
    parseInline?: InlineDataNodeParseFunc,
  ): SetextHeadingDataNode {
    const result: SetextHeadingDataNode = {
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

  /**
   * override
   */
  public beforeCloseMatchState(state: SetextHeadingDataNodeMatchState): void {
    /**
     * Trailing spaces in the content line do not cause a line break
     * @see https://github.github.com/gfm/#example-59
     */
    const [leftIndex, rightIndex] = calcTrimBoundaryOfCodePoints(state.content)
    if (rightIndex - leftIndex < state.content.length) {
      // eslint-disable-next-line no-param-reassign
      state.content = state.content.slice(leftIndex, rightIndex)
    }
  }
}
