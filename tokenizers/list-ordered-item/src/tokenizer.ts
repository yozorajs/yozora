import type { EnhancedYastNodePoint } from '@yozora/tokenizercore'
import type {
  BlockTokenizer,
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerParsePhaseHook,
  BlockTokenizerParsePhaseState,
  BlockTokenizerProps,
  EatingLineInfo,
  ResultOfEatAndInterruptPreviousSibling,
  ResultOfEatContinuationText,
  ResultOfEatOpener,
  ResultOfParse,
} from '@yozora/tokenizercore-block'
import type {
  ListOrderedItem as PS,
  ListOrderedItemMatchPhaseState as MS,
  ListOrderedItemPostMatchPhaseState as PMS,
  ListOrderedItemType as T,
} from './types'
import {
  AsciiCodePoint,
  isAsciiNumberCharacter,
  isSpaceCharacter,
} from '@yozora/character'
import {
  BaseBlockTokenizer,
  PhrasingContentType,
} from '@yozora/tokenizercore-block'
import { ListOrderedItemType, OrderedListType } from './types'


/**
 * Lexical Analyzer for ListOrderedItem
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
export class ListOrderedItemTokenizer extends BaseBlockTokenizer<T> implements
  BlockTokenizer<T>,
  BlockTokenizerMatchPhaseHook<T, MS>,
  BlockTokenizerParsePhaseHook<T, PMS, PS>
{
  public readonly name = 'ListOrderedItemTokenizer'
  public readonly uniqueTypes: T[] = [ListOrderedItemType]

  public constructor(props: BlockTokenizerProps) {
    super({
      ...props,
      interruptableTypes: props.interruptableTypes || [PhrasingContentType],
    })
  }

  /**
   * @override
   * @see BlockTokenizerMatchPhaseHook
   */
  public eatOpener(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    eatingInfo: EatingLineInfo,
  ): ResultOfEatOpener<T, MS> {
    const { startIndex, isBlankLine, firstNonWhiteSpaceIndex, endIndex } = eatingInfo
    if (isBlankLine || firstNonWhiteSpaceIndex - startIndex > 3) return null

    // eat marker
    let listType: OrderedListType | null = null
    let marker: number | null = null
    let order: number | undefined
    let i = firstNonWhiteSpaceIndex
    let c = nodePoints[i]

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
        c = nodePoints[i]
        if (!isAsciiNumberCharacter(c.codePoint)) break
        v = (v * 10) + c.codePoint - AsciiCodePoint.NUMBER_ZERO
      }
      // eat '.' / ')'
      if (i > firstNonWhiteSpaceIndex && i - firstNonWhiteSpaceIndex <= 9) {
        if (
          c.codePoint === AsciiCodePoint.DOT ||
          c.codePoint === AsciiCodePoint.CLOSE_PARENTHESIS
        ) {
          i += 1
          listType = OrderedListType
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
      c = nodePoints[i]
      if (!isSpaceCharacter(c.codePoint)) break
      spaceCnt += 1
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

    let topBlankLineCount = -1
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
    const state: MS = {
      type: ListOrderedItemType,
      listType: listType!,
      marker,
      order,
      indent,
      spread: false,
      countOfTopBlankLine: topBlankLineCount,
      isPreviousLineBlank: false,
      isLastLineBlank: false,
    }
    return { state, nextIndex: i }
  }

  /**
   * @override
   * @see BlockTokenizerMatchPhaseHook
   */
  public eatAndInterruptPreviousSibling(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    eatingInfo: EatingLineInfo,
  ): ResultOfEatAndInterruptPreviousSibling<T, MS> {
    /**
     * ListOrderedItem can interrupt Paragraph
     * @see https://github.github.com/gfm/#list-items Basic case Exceptions 1
     */
    const result = this.eatOpener(nodePoints, eatingInfo)
    if (result == null) return null

    /**
     * But an empty list item cannot interrupt a paragraph
     * @see https://github.github.com/gfm/#example-263
     */
    if (result.state.indent === eatingInfo.endIndex - eatingInfo.startIndex) {
      return null
    }

    /**
     * In order to solve of unwanted lists in paragraphs with hard-wrapped
     * numerals, we allow only lists starting with 1 to interrupt paragraphs
     * @see https://github.github.com/gfm/#example-284
     */
    if (result.state.order !== 1) {
      return null
    }

    return result
  }

  /**
   * @override
   * @see BlockTokenizerMatchPhaseHook
   */
  public eatContinuationText(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    eatingInfo: EatingLineInfo,
    state: MS,
  ): ResultOfEatContinuationText {
    const { startIndex, firstNonWhiteSpaceIndex, isBlankLine } = eatingInfo
    const indent = firstNonWhiteSpaceIndex - startIndex

    /**
     * A list item can begin with at most one blank line
     * @see https://github.github.com/gfm/#example-258
     */
    if (!isBlankLine && indent < state.indent) return null

    /**
     * The blank line information is updated only when current line is still in
     * the opening ListBulletItem
     */
    // eslint-disable-next-line no-param-reassign
    state.isPreviousLineBlank = state.isLastLineBlank
    // eslint-disable-next-line no-param-reassign
    state.isLastLineBlank = eatingInfo.isBlankLine

    /**
     * When encountering a blank line, it consumes at most indent characters
     * and cannot exceed the newline character
     * @see https://github.github.com/gfm/#example-242
     * @see https://github.github.com/gfm/#example-298
     */
    let nextIndex: number
    if (isBlankLine) {
      if (state.countOfTopBlankLine >= 0) {
        // eslint-disable-next-line no-param-reassign
        state.countOfTopBlankLine += 1
        if (state.countOfTopBlankLine > 1) return null
      }
      nextIndex = Math.min(eatingInfo.endIndex - 1, startIndex + state.indent)
    } else {
      // eslint-disable-next-line no-param-reassign
      state.countOfTopBlankLine = -1
      nextIndex = startIndex + state.indent
    }

    return { nextIndex }
  }

  /**
   * @override
   * @see BlockTokenizerParsePhaseHook
   */
  public parse(
    postMatchState: Readonly<PMS>,
    children?: BlockTokenizerParsePhaseState[],
  ): ResultOfParse<T, PS> {
    const state: PS = {
      type: postMatchState.type,
      listType: postMatchState.listType,
      marker: postMatchState.marker,
      order: postMatchState.order,
      children: children || [],
    }
    return { classification: 'flow', state }
  }
}
