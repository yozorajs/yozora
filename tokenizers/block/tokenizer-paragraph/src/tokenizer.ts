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
  calcTrimBoundaryOfCodePoints,
} from '@yozora/tokenizer-core'
import {
  ParagraphDataNode,
  ParagraphDataNodeData,
  ParagraphDataNodeType,
} from './types'


type T = ParagraphDataNodeType

export interface ParagraphDataNodeMatchState extends BlockDataNodeMatchState<T> {
  /**
   * paragraph 中的文本内容
   */
  content: DataNodeTokenPointDetail[]
}


export interface ParagraphDataNodeMatchResult extends BlockDataNodeMatchResult<T> {
  /**
   * paragraph 中的文本内容
   */
  content: DataNodeTokenPointDetail[]
}


/**
 * Lexical Analyzer for ParagraphDataNode
 *
 * A sequence of non-blank lines that cannot be interpreted as other kinds
 * of blocks forms a paragraph. The contents of the paragraph are the result
 * of parsing the paragraph’s raw content as inlines. The paragraph’s raw
 * content is formed by concatenating the lines and removing initial and
 * final whitespace.
 * @see https://github.github.com/gfm/#paragraphs
 */
export class ParagraphTokenizer extends BaseBlockDataNodeTokenizer<
  T,
  ParagraphDataNodeData,
  ParagraphDataNodeMatchState,
  ParagraphDataNodeMatchResult>
  implements BlockDataNodeTokenizer<
  T,
  ParagraphDataNodeData,
  ParagraphDataNodeMatchState,
  ParagraphDataNodeMatchResult> {
  public readonly name = 'ParagraphTokenizer'
  public readonly recognizedTypes: T[] = [ParagraphDataNodeType]

  /**
   * override
   */
  public eatNewMarker(
    codePoints: DataNodeTokenPointDetail[],
    eatingLineInfo: BlockDataNodeEatingLineInfo,
    parentState: BlockDataNodeMatchState,
  ): BlockDataNodeEatingResult<T, ParagraphDataNodeMatchState> | null {
    if (eatingLineInfo.isBlankLine) return null
    const { endIndex, firstNonWhiteSpaceIndex } = eatingLineInfo
    const state: ParagraphDataNodeMatchState = {
      type: ParagraphDataNodeType,
      opening: true,
      parent: parentState,
      content: codePoints.slice(firstNonWhiteSpaceIndex, endIndex),
    }
    return { nextIndex: endIndex, state }
  }

  /**
   * override
   */
  public eatLazyContinuationText(
    codePoints: DataNodeTokenPointDetail[],
    eatingLineInfo: BlockDataNodeEatingLineInfo,
    state: ParagraphDataNodeMatchState,
  ): BlockDataNodeEatingResult<T, ParagraphDataNodeMatchState> | null {
    /**
     * Paragraphs can contain multiple lines, but no blank lines
     * @see https://github.github.com/gfm/#example-190
     */
    if (eatingLineInfo.isBlankLine) return null
    const { endIndex, firstNonWhiteSpaceIndex } = eatingLineInfo

    /**
     * Leading spaces are skipped
     * @see https://github.github.com/gfm/#example-192
     */
    for (let i = firstNonWhiteSpaceIndex; i < endIndex; ++i) {
      state.content.push(codePoints[i])
    }
    return { nextIndex: endIndex, state }
  }

  /**
   * override
   */
  public match(state: ParagraphDataNodeMatchState): ParagraphDataNodeMatchResult {
    const result: ParagraphDataNodeMatchResult = {
      type: state.type,
      content: state.content,
    }
    return result
  }

  /**
   * override
   */
  public parse(
    codePoints: DataNodeTokenPointDetail[],
    matchResult: ParagraphDataNodeMatchResult,
    children?: BlockDataNode[],
    parseInline?: InlineDataNodeParseFunc,
  ): ParagraphDataNode {
    const result: ParagraphDataNode = {
      type: matchResult.type,
      data: {
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
  public beforeCloseMatchState(state: ParagraphDataNodeMatchState): void {
    /**
     * do trim
     *
     * Final spaces are stripped before inline parsing, so a paragraph that
     * ends with two or more spaces will not end with a hard line break
     * @see https://github.github.com/gfm/#example-196
     */
    const [leftIndex, rightIndex] = calcTrimBoundaryOfCodePoints(state.content)
    if (rightIndex - leftIndex < state.content.length) {
      // eslint-disable-next-line no-param-reassign
      state.content = state.content.slice(leftIndex, rightIndex)
    }
  }
}
