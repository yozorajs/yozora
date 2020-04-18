import {
  BaseBlockDataNodeTokenizer,
  BlockDataNode,
  BlockDataNodeEatingLineInfo,
  BlockDataNodeMatchResult,
  BlockDataNodeMatchState,
  BlockDataNodeTokenizer,
  CodePoint,
  DataNodeTokenPointDetail,
} from '@yozora/tokenizer-core'
import {
  ListItemDataNode,
  ListItemDataNodeData,
  ListItemDataNodeType,
  ListType,
} from './types'


type T = ListItemDataNodeType


export interface ListItemDataNodeMatchResult extends BlockDataNodeMatchResult<T> {
  listType: ListType
  indent: number
  marker: number
  delimiter: number
  spread: boolean
}


export interface ListItemDataNodeMatchState extends BlockDataNodeMatchState<T> {
  listType: ListType
  indent: number
  marker: number
  delimiter: number
  spread: boolean
  topBlankLineCount: number
}


/**
 * Lexical Analyzer for ListItemDataNode
 *
 * A list marker is a bullet list marker or an ordered list marker.
 * @see https://github.github.com/gfm/#list-marker
 */
export class ListItemTokenizer extends BaseBlockDataNodeTokenizer<
  T,
  ListItemDataNodeData,
  ListItemDataNodeMatchState,
  ListItemDataNodeMatchResult>
  implements BlockDataNodeTokenizer<
  T,
  ListItemDataNodeData,
  ListItemDataNodeMatchState,
  ListItemDataNodeMatchResult> {
  public readonly name = 'ListItemTokenizer'
  public readonly recognizedTypes: T[] = [ListItemDataNodeType]

  /**
   * override
   */
  public eatNewMarker(
    codePoints: DataNodeTokenPointDetail[],
    eatingLineInfo: BlockDataNodeEatingLineInfo,
    parentState: BlockDataNodeMatchState,
  ): [number, ListItemDataNodeMatchState | null] {
    const { startIndex, isBlankLine, firstNonWhiteSpaceIndex, endIndex } = eatingLineInfo
    if (isBlankLine) return [-1, null]

    // eat marker
    let listType: ListType | null = null
    let marker: number | null = null
    let delimiter = 0
    let i = firstNonWhiteSpaceIndex
    let c = codePoints[i]

    /**
     * eat bullet
     *
     * A bullet list marker is a -, +, or * character.
     * @see https://github.github.com/gfm/#bullet-list-marker
     */
    if (
      c.codePoint === CodePoint.PLUS_SIGN
      || c.codePoint === CodePoint.HYPHEN
      || c.codePoint === CodePoint.ASTERISK
    ) {
      ++i
      listType = 'bullet'
      marker = c.codePoint
    }

    /**
     * eat arabic number
     *
     * An ordered list marker is a sequence of 1–9 arabic digits (0-9),
     * followed by either a . character or a ) character. (The reason
     * for the length limit is that with 10 digits we start seeing integer
     * overflows in some browsers.)
     * @see https://github.github.com/gfm/#ordered-list-marker
     */
    if (marker == null) {
      let v = 0
      for (; i < endIndex; ++i) {
        c = codePoints[i]
        if (c.codePoint < CodePoint.ZERO || c.codePoint > CodePoint.NINE) break
        v = v * 10 + c.codePoint - CodePoint.ZERO
      }
      // eat '.' / ')'
      if (i > firstNonWhiteSpaceIndex && i - firstNonWhiteSpaceIndex <= 9) {
        if (c.codePoint === CodePoint.DOT || c.codePoint === CodePoint.CLOSE_PARENTHESIS) {
          ++i
          listType = 'ordered'
          marker = v
          delimiter = c.codePoint
        }
      }
    }

    if (marker == null) return [-1, null]

    /**
     * #Rule1 Basic case
     *
     * If a sequence of lines Ls constitute a sequence of blocks Bs starting
     * with a non-whitespace character, and M is a list marker of width W
     * followed by 1 ≤ N ≤ 4 spaces, then the result of prepending M and the
     * following spaces to the first line of Ls, and indenting subsequent
     * lines of Ls by W + N spaces, is a list item with Bs as its contents.
     * The type of the list item (bullet or ordered) is determined by the
     * type of its list marker. If the list item is ordered, then it is also
     * assigned a start number, based on the ordered list marker.
     * @see https://github.github.com/gfm/#list-items Basic case
     */
    let spaceCnt = 0
    for (; i < endIndex; ++i) {
      c = codePoints[i]
      if (c.codePoint !== CodePoint.SPACE) break
      ++spaceCnt
    }

    /**
     * Rule#2 Item starting with indented code.
     *
     * If a sequence of lines Ls constitute a sequence of blocks Bs starting
     * with an indented code block, and M is a list marker of width W followed
     * by one space, then the result of prepending M and the following space to
     * the first line of Ls, and indenting subsequent lines of Ls by W + 1 spaces,
     * is a list item with Bs as its contents. If a line is empty, then it need
     * not be indented. The type of the list item (bullet or ordered) is
     * determined by the type of its list marker. If the list item is ordered,
     * then it is also assigned a start number, based on the ordered list marker.
     * @see https://github.github.com/gfm/#list-items Item starting with indented code.
     */
    if (spaceCnt > 4) {
      i -= spaceCnt - 1
      spaceCnt = 1
    }

    /**
     * Rule#3 Item starting with a blank line.
     *
     * If a sequence of lines Ls starting with a single blank line constitute
     * a (possibly empty) sequence of blocks Bs, not separated from each other
     * by more than one blank line, and M is a list marker of width W, then the
     * result of prepending M to the first line of Ls, and indenting subsequent
     * lines of Ls by W + 1 spaces, is a list item with Bs as its contents.
     * If a line is empty, then it need not be indented. The type of the list
     * item (bullet or ordered) is determined by the type of its list marker.
     * If the list item is ordered, then it is also assigned a start number,
     * based on the ordered list marker.
     * @see https://github.github.com/gfm/#list-items Item starting with a blank line
     */
    let topBlankLineCount = 0
    if (spaceCnt <= 0) {
      if (i < endIndex) {
        if (c.codePoint !== CodePoint.LINE_FEED) return [-1, null]
        ++i
        ++topBlankLineCount
      }
      /**
       * an empty list item cannot interrupt a paragraph:
       * @see https://github.github.com/gfm/#example-263
       */
      if (parentState.children!.length > 0) {
        const previousSiblingNode = parentState.children![parentState.children!.length - 1]
        if (previousSiblingNode.type === 'PARAGRAPH') return [-1, null]
      }
    }

    /**
     * Rule#4 Indentation.
     *
     * If a sequence of lines Ls constitutes a list item according to rule #1,
     * #2, or #3, then the result of indenting each line of Ls by 1-3 spaces
     * (the same for each line) also constitutes a list item with the same
     * contents and attributes. If a line is empty, then it need not be indented.
     */
    const indent = i - startIndex
    const result: ListItemDataNodeMatchState = {
      type: ListItemDataNodeType,
      opening: true,
      children: [],
      listType: listType!,
      marker,
      delimiter,
      indent,
      spread: isBlankLine,
      topBlankLineCount,
    }
    return [i, result]
  }

  /**
   * override
   */
  public eatContinuationText(
    codePoints: DataNodeTokenPointDetail[],
    eatingLineInfo: BlockDataNodeEatingLineInfo,
    state: ListItemDataNodeMatchState,
  ): [number, boolean] {
    const { startIndex, firstNonWhiteSpaceIndex, isBlankLine } = eatingLineInfo
    const indent = firstNonWhiteSpaceIndex - startIndex
    /**
     * A list item can begin with at most one blank line
     * @see https://github.github.com/gfm/#example-258
     */
    if (isBlankLine) {
      if (state.children!.length <= 0) {
        // eslint-disable-next-line no-param-reassign
        state.topBlankLineCount += 1
        if (state.topBlankLineCount > 1) return [-1, false]
      }
      // eslint-disable-next-line no-param-reassign
      state.spread = true
    } else if (indent < state.indent) return [-1, false]
    return [startIndex + state.indent, true]
  }

  /**
   * override
   */
  public parse(
    codePoints: DataNodeTokenPointDetail[],
    matchResult: ListItemDataNodeMatchResult,
    children?: BlockDataNode[],
  ): ListItemDataNode {
    return {
      type: ListItemDataNodeType,
      data: {
        listType: matchResult.listType,
        marker: matchResult.marker,
        delimiter: matchResult.delimiter,
        indent: matchResult.indent,
        spread: matchResult.spread,
        children: children || [],
      }
    }
  }
}
