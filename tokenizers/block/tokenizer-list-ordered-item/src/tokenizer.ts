import {
  AsciiCodePoint,
  isAsciiNumberCharacter,
  isSpaceCharacter,
} from '@yozora/character'
import { ParagraphDataNodeType } from '@yozora/tokenizer-paragraph'
import { DataNodeTokenPointDetail } from '@yozora/tokenizercore'
import {
  BaseBlockTokenizer,
  BlockTokenizer,
  BlockTokenizerEatingInfo,
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseHook,
  BlockTokenizerParsePhaseState,
  BlockTokenizerPreMatchPhaseHook,
  BlockTokenizerPreMatchPhaseState,
  BlockTokenizerPreParsePhaseState,
} from '@yozora/tokenizercore-block'
import {
  ListOrderedItemDataNode,
  ListOrderedItemDataNodeType,
  ListType,
} from './types'


type T = ListOrderedItemDataNodeType


/**
 * State of pre-match phase of ListOrderedItemTokenizer
 */
export interface ListOrderedItemTokenizerPreMatchPhaseState
  extends BlockTokenizerPreMatchPhaseState<T> {
  /**
   * 列表类型
   * List type
   */
  listType: ListType
  /**
   * 标记或分隔符
   * Marker of bullet list-ordered-item, and delimiter of ordered list-ordered-item
   */
  marker: number
  /**
   * 列表序号
   * Serial number of ordered list-ordered-item
   */
  order: number
  /**
   * 缩进
   * Indent of list-ordered-item
   */
  indent: number
  /**
   * Whether exists blank line in the list-ordered-item
   */
  spread: boolean
  /**
   * list-ordered-item 起始的空行数量
   * The number of blank lines at the beginning of a list-ordered-item
   */
  topBlankLineCount: number
  /**
   * 上一行是否为空行
   * Whether the previous line is blank line or not
   */
  isPreviousLineBlank: boolean
  /**
   * 最后一行是否为空行
   * Whether the last line is blank line or not
   */
  isLastLineBlank: boolean
  /**
   * 空行前最后一个子结点为关闭状态时，最少的子节点数量
   * The minimum number of child nodes when the last child before the blank line is closed
   */
  minNumberOfChildBeforeBlankLine: number
}


/**
 * State of match phase of ListOrderedItemTokenizer
 */
export interface ListOrderedItemTokenizerMatchPhaseState
  extends BlockTokenizerMatchPhaseState<T> {
  /**
   * 列表类型
   * List type
   */
  listType: ListType
  /**
   * 标记或分隔符
   * Marker of bullet list-ordered-item, and delimiter of ordered list-ordered-item
   */
  marker: number
  /**
   * 列表序号
   * Serial number of ordered list-ordered-item
   */
  order: number
  /**
   * 缩进
   * Indent of list-ordered-item
   */
  indent: number
  /**
   * Whether exists blank line in the list-ordered-item
   */
  spread: boolean
  /**
   * 最后一行是否为空行
   * Whether the last line is blank line or not
   */
  isLastLineBlank: boolean
}


/**
 * Lexical Analyzer for ListOrderedItemDataNode
 *
 * The following rules define list items:
 *  - Basic case. If a sequence of lines Ls constitute a sequence of blocks Bs
 *    starting with a non-whitespace character, and M is a list marker of width
 *    W followed by 1 ≤ N ≤ 4 spaces, then the result of prepending M and the
 *    following spaces to the first line of Ls, and indenting subsequent lines
 *    of Ls by W + N spaces, is a list item with Bs as its contents. The type
 *    of the list item (bullet or ordered) is determined by the type of its
 *    list marker. If the list item is ordered, then it is also assigned a
 *    start number, based on the ordered list marker.
 *
 *    Exceptions:
 *      - When the first list item in a list interrupts a paragraph—that is,
 *        when it starts on a line that would otherwise count as paragraph
 *        continuation text—then
 *        (a) the lines Ls must not begin with a blank line, and
 *        (b) if the list item is ordered, the start number must be 1.
 *      - If any line is a thematic break then that line is not a list item.
 * @see https://github.github.com/gfm/#list-marker
 */
export class ListOrderedItemTokenizer extends BaseBlockTokenizer<T>
  implements
    BlockTokenizer<T>,
    BlockTokenizerPreMatchPhaseHook<
      T,
      ListOrderedItemTokenizerPreMatchPhaseState>,
    BlockTokenizerMatchPhaseHook<
      T,
      ListOrderedItemTokenizerPreMatchPhaseState, ListOrderedItemTokenizerMatchPhaseState>,
    BlockTokenizerParsePhaseHook<
      T,
      ListOrderedItemTokenizerMatchPhaseState,
      ListOrderedItemDataNode>
{
  public readonly name = 'ListOrderedItemTokenizer'
  public readonly uniqueTypes: T[] = [ListOrderedItemDataNodeType]

  /**
   * hook of @BlockTokenizerPreMatchPhaseHook
   */
  public eatNewMarker(
    codePositions: DataNodeTokenPointDetail[],
    eatingInfo: BlockTokenizerEatingInfo,
    parentState: Readonly<BlockTokenizerPreMatchPhaseState>,
  ): {
    nextIndex: number,
    state: ListOrderedItemTokenizerPreMatchPhaseState,
  } | null {
    const { startIndex, isBlankLine, firstNonWhiteSpaceIndex, endIndex } = eatingInfo
    if (isBlankLine || firstNonWhiteSpaceIndex - startIndex > 3) return null

    // eat marker
    let listType: ListType | null = null
    let marker: number | null = null
    let order: number | undefined
    let i = firstNonWhiteSpaceIndex
    let c = codePositions[i]

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
        c = codePositions[i]
        if (!isAsciiNumberCharacter(c.codePoint)) break
        v = v * 10 + c.codePoint - AsciiCodePoint.NUMBER_ZERO
      }
      // eat '.' / ')'
      if (i > firstNonWhiteSpaceIndex && i - firstNonWhiteSpaceIndex <= 9) {
        if (c.codePoint === AsciiCodePoint.DOT || c.codePoint === AsciiCodePoint.CLOSE_PARENTHESIS) {
          ++i
          listType = 'ordered'
          order = v
          marker = c.codePoint
        }
      }
    }

    if (marker == null || order == null) return null

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
      c = codePositions[i]
      if (!isSpaceCharacter(c.codePoint)) break
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
    if (spaceCnt <= 0 && i < endIndex && c.codePoint !== AsciiCodePoint.LINE_FEED) return null

    let topBlankLineCount = 0
    let indent = i - startIndex
    if (c.codePoint === AsciiCodePoint.LINE_FEED) {
      i = i - spaceCnt + 1
      indent = i - startIndex
      topBlankLineCount = 1
    }

    /**
     * Rule#4 Indentation.
     *
     * If a sequence of lines Ls constitutes a list item according to rule #1,
     * #2, or #3, then the result of indenting each line of Ls by 1-3 spaces
     * (the same for each line) also constitutes a list item with the same
     * contents and attributes. If a line is empty, then it need not be indented.
     */
    const state: ListOrderedItemTokenizerPreMatchPhaseState = {
      type: ListOrderedItemDataNodeType,
      opening: true,
      parent: parentState,
      children: [],
      listType: listType!,
      marker,
      order,
      indent,
      spread: false,
      topBlankLineCount,
      isPreviousLineBlank: false,
      isLastLineBlank: false,
      minNumberOfChildBeforeBlankLine: 0,
    }
    return { nextIndex: i, state }
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
    state: ListOrderedItemTokenizerPreMatchPhaseState,
    shouldRemovePreviousSibling: boolean,
  } | null {
    const self = this
    switch (previousSiblingState.type) {
      /**
       * ListOrderedItem can interrupt Paragraph
       * @see https://github.github.com/gfm/#list-items Basic case Exceptions 1
       */
      case ParagraphDataNodeType: {
        const eatingResult = self.eatNewMarker(codePositions, eatingInfo, parentState)
        if (eatingResult == null) return null

        /**
         * But an empty list item cannot interrupt a paragraph
         * @see https://github.github.com/gfm/#example-263
         */
        if (eatingResult.state.indent === eatingInfo.endIndex - eatingInfo.startIndex) {
          return null
        }

        /**
         * In order to solve of unwanted lists in paragraphs with hard-wrapped
         * numerals, we allow only lists starting with 1 to interrupt paragraphs
         * @see https://github.github.com/gfm/#example-284
         */
        if (eatingResult.state.order !== 1) {
          return null
        }

        return { ...eatingResult, shouldRemovePreviousSibling: false }
      }
      default:
        return null
    }
  }

  /**
   * hook of @BlockTokenizerPreMatchPhaseHook
   */
  public eatContinuationText(
    codePositions: DataNodeTokenPointDetail[],
    eatingInfo: BlockTokenizerEatingInfo,
    state: ListOrderedItemTokenizerPreMatchPhaseState,
  ): { nextIndex: number, saturated: boolean } | null {
    const { startIndex, firstNonWhiteSpaceIndex, isBlankLine } = eatingInfo
    const indent = firstNonWhiteSpaceIndex - startIndex

    /**
     * A list item can begin with at most one blank line
     * @see https://github.github.com/gfm/#example-258
     */
    if (!isBlankLine && indent < state.indent) return null

    /**
     * 仅当当前行仍处于未闭合的 ListOrderedItem 中时，才更新空行信息
     * The blank line information is updated only when current line is still in
     * the open ListOrderedItem
     */
    // eslint-disable-next-line no-param-reassign
    state.isPreviousLineBlank = state.isLastLineBlank
    // eslint-disable-next-line no-param-reassign
    state.isLastLineBlank = eatingInfo.isBlankLine

    if (isBlankLine) {
      if (state.children!.length <= 0) {
        // eslint-disable-next-line no-param-reassign
        state.topBlankLineCount += 1
        if (state.topBlankLineCount > 1) return null
      }
    }
    return { nextIndex: startIndex + state.indent, saturated: false }
  }

  /**
   * hook of @BlockTokenizerPreMatchPhaseHook
   */
  public beforeAcceptChild(state: ListOrderedItemTokenizerPreMatchPhaseState): void {
    /**
     * 检查子元素之间是否存在空行
     * Checks if there are blank lines between child elements
     *
     * @see https://github.github.com/gfm/#example-305
     */
    if (
      state.isPreviousLineBlank
      && state.minNumberOfChildBeforeBlankLine <= 0
      && state.children!.length > 0) {
      const lastChild = state.children![state.children!.length - 1]
      if (!lastChild.opening) {
        // eslint-disable-next-line no-param-reassign
        state.minNumberOfChildBeforeBlankLine = state.children!.length
      }
    }
  }

  /**
   * hook of @BlockTokenizerMatchPhaseHook
   */
  public match(
    preMatchPhaseState: ListOrderedItemTokenizerPreMatchPhaseState,
  ): ListOrderedItemTokenizerMatchPhaseState{
    /**
     * 如果子元素之间存在空行，则此 ListOrderedItem 构成的 List 是 loose 的
     * If one of the list-ordered-item directly contains two block-level elements with
     * a blank line between them, it is a loose lists.
     *
     * @see https://github.github.com/gfm/#example-296
     * @see https://github.github.com/gfm/#example-297
     */
    let spread: boolean = preMatchPhaseState.spread
    if (
      preMatchPhaseState.minNumberOfChildBeforeBlankLine > 0
      && preMatchPhaseState.minNumberOfChildBeforeBlankLine < preMatchPhaseState.children!.length) {
      spread = true
    }

    const result: ListOrderedItemTokenizerMatchPhaseState = {
      type: preMatchPhaseState.type,
      classify: 'flow',
      listType: preMatchPhaseState.listType,
      marker: preMatchPhaseState.marker,
      order: preMatchPhaseState.order,
      indent: preMatchPhaseState.indent,
      isLastLineBlank: preMatchPhaseState.isLastLineBlank,
      spread,
    }
    return result
  }

  /**
   * hook of @BlockTokenizerParsePhaseHook
   */
  public parseFlow(
    matchPhaseState: ListOrderedItemTokenizerMatchPhaseState,
    preParsePhaseState: BlockTokenizerPreParsePhaseState,
    children?: BlockTokenizerParsePhaseState[],
  ): ListOrderedItemDataNode {
    const result: ListOrderedItemDataNode = {
      type: matchPhaseState.type,
      listType: matchPhaseState.listType,
      marker: matchPhaseState.marker,
      order: matchPhaseState.order,
      children: children || [],
    }
    return result
  }
}
