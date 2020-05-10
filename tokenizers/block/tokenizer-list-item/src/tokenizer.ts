import {
  BaseBlockTokenizer,
  BlockTokenizer,
  BlockTokenizerEatingInfo,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseHook,
  BlockTokenizerPreMatchPhaseHook,
  BlockTokenizerPreMatchPhaseState,
} from '@yozora/block-tokenizer-core'
import {
  AsciiCodePoint,
  isAsciiNumberCharacter,
  isSpaceCharacter,
} from '@yozora/character'
import { DataNodeTokenPointDetail } from '@yozora/tokenizer-core'
import { ParagraphDataNodeType } from '@yozora/tokenizer-paragraph'
import { ListItemDataNode, ListItemDataNodeType, ListType } from './types'


type T = ListItemDataNodeType


/**
 * State of pre-match phase of ListItemTokenizer
 */
export interface ListItemTokenizerPreMatchPhaseState
  extends BlockTokenizerPreMatchPhaseState<T> {
  /**
   *
   */
  listType: ListType
  /**
   *
   */
  indent: number
  /**
   *
   */
  marker: number
  /**
   *
   */
  delimiter: number
  /**
   *
   */
  spread: boolean
  /**
   *
   */
  topBlankLineCount: number
  /**
   *
   */
  isCurrentLineBlank: boolean
  /**
   *
   */
  isLastLineBlank: boolean
}


/**
 * State of match phase of ListItemTokenizer
 */
export interface ListItemTokenizerMatchPhaseState
  extends BlockTokenizerMatchPhaseState<T> {
  /**
   *
   */
  listType: ListType
  /**
   *
   */
  indent: number
  /**
   *
   */
  marker: number
  /**
   *
   */
  delimiter: number
}


/**
 * Lexical Analyzer for ListItemDataNode
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
export class ListItemTokenizer extends BaseBlockTokenizer<T>
  implements
    BlockTokenizer<T>,
    BlockTokenizerPreMatchPhaseHook<T, ListItemTokenizerPreMatchPhaseState>,
    BlockTokenizerParsePhaseHook<T, ListItemTokenizerMatchPhaseState, ListItemDataNode>
{
  public readonly name = 'ListItemTokenizer'
  public readonly uniqueTypes: T[] = [ListItemDataNodeType]

  /**
   * hook of @BlockTokenizerPreMatchPhaseHook
   */
  public eatNewMarker(
    codePositions: DataNodeTokenPointDetail[],
    eatingInfo: BlockTokenizerEatingInfo,
    parentState: Readonly<BlockTokenizerPreMatchPhaseState>,
  ): {
    nextIndex: number,
    state: ListItemTokenizerPreMatchPhaseState,
  } | null {
    const { startIndex, isBlankLine, firstNonWhiteSpaceIndex, endIndex } = eatingInfo
    if (isBlankLine || firstNonWhiteSpaceIndex - startIndex > 3) return null

    // eat marker
    let listType: ListType | null = null
    let marker: number | null = null
    let delimiter = 0
    let i = firstNonWhiteSpaceIndex
    let c = codePositions[i]

    /**
     * eat bullet
     *
     * A bullet list marker is a -, +, or * character.
     * @see https://github.github.com/gfm/#bullet-list-marker
     */
    if (
      c.codePoint === AsciiCodePoint.PLUS_SIGN
      || c.codePoint === AsciiCodePoint.MINUS_SIGN
      || c.codePoint === AsciiCodePoint.ASTERISK
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
        c = codePositions[i]
        if (!isAsciiNumberCharacter(c.codePoint)) break
        v = v * 10 + c.codePoint - AsciiCodePoint.NUMBER_ZERO
      }
      // eat '.' / ')'
      if (i > firstNonWhiteSpaceIndex && i - firstNonWhiteSpaceIndex <= 9) {
        if (c.codePoint === AsciiCodePoint.DOT || c.codePoint === AsciiCodePoint.CLOSE_PARENTHESIS) {
          ++i
          listType = 'ordered'
          marker = v
          delimiter = c.codePoint
        }
      }
    }

    if (marker == null) return null

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
    let topBlankLineCount = 0
    if (spaceCnt <= 0) {
      if (i < endIndex) {
        if (c.codePoint !== AsciiCodePoint.LINE_FEED) return null
        ++i
        ++topBlankLineCount
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
    const state: ListItemTokenizerPreMatchPhaseState = {
      type: ListItemDataNodeType,
      opening: true,
      parent: parentState,
      children: [],
      listType: listType!,
      marker,
      delimiter,
      indent,
      spread: false,
      topBlankLineCount,
      isCurrentLineBlank: false,
      isLastLineBlank: false,
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
    state: ListItemTokenizerPreMatchPhaseState,
    shouldRemovePreviousSibling: boolean,
  } | null {
    /**
     * ListItem can interrupt Paragraph
     * @see https://github.github.com/gfm/#list-items 1.1
     */
    if (previousSiblingState.type !== ParagraphDataNodeType) return null

    const self = this
    const eatingResult = self.eatNewMarker(codePositions, eatingInfo, parentState)
    if (eatingResult == null) return null

    /**
     * But an empty list item cannot interrupt a paragraph
     * @see https://github.github.com/gfm/#example-263
     */
    const isEmptyListItem = (
      eatingResult.state.indent === eatingInfo.endIndex - eatingInfo.startIndex)
    if (isEmptyListItem) return null
    return { ...eatingResult, shouldRemovePreviousSibling: false }
  }

  /**
   * hook of @BlockTokenizerPreMatchPhaseHook
   */
  public eatContinuationText(
    codePositions: DataNodeTokenPointDetail[],
    eatingInfo: BlockTokenizerEatingInfo,
    state: ListItemTokenizerPreMatchPhaseState,
  ): number | -1 {
    // eslint-disable-next-line no-param-reassign
    state.isLastLineBlank = state.isCurrentLineBlank
    // eslint-disable-next-line no-param-reassign
    state.isCurrentLineBlank = eatingInfo.isBlankLine

    const { startIndex, firstNonWhiteSpaceIndex, isBlankLine } = eatingInfo
    const indent = firstNonWhiteSpaceIndex - startIndex
    /**
     * A list item can begin with at most one blank line
     * @see https://github.github.com/gfm/#example-258
     */
    if (isBlankLine) {
      if (state.children!.length <= 0) {
        // eslint-disable-next-line no-param-reassign
        state.topBlankLineCount += 1
        if (state.topBlankLineCount > 1) return -1
      }
    } else if (indent < state.indent) return -1
    return startIndex + state.indent
  }

  /**
   * hook of @BlockTokenizerMatchPhaseHook
   */
  public match(
    preMatchPhaseState: ListItemTokenizerPreMatchPhaseState,
  ): ListItemTokenizerMatchPhaseState{
    const result: ListItemTokenizerMatchPhaseState = {
      type: preMatchPhaseState.type,
      classify: 'flow',
      listType: preMatchPhaseState.listType,
      indent: preMatchPhaseState.indent,
      marker: preMatchPhaseState.marker,
      delimiter: preMatchPhaseState.delimiter,
    }
    return result
  }

  /**
   * hook of @BlockTokenizerParseFlowPhaseHook
   */
  public parseFlow(
    matchPhaseState: ListItemTokenizerMatchPhaseState,
  ): ListItemDataNode {
    return {
      type: matchPhaseState.type,
      data: {
        listType: matchPhaseState.listType,
        marker: matchPhaseState.marker,
        delimiter: matchPhaseState.delimiter,
        indent: matchPhaseState.indent,
      }
    }
  }

  /**
   * hook of @BlockTokenizerMatchPhaseHook
   */
  public eatEnd(state: ListItemTokenizerPreMatchPhaseState): void {
    /**
     * These are loose lists, even though there is no space between the items,
     * because one of the items directly contains two block-level elements with
     * a blank line between them
     * @see https://github.github.com/gfm/#example-296
     */
    if (state.isLastLineBlank) {
      if (state.children != null && state.children.length > 0) {
        // eslint-disable-next-line no-param-reassign
        state.spread = true
      }
    }
  }
}
