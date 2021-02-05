import type { NodePoint } from '@yozora/character'
import type {
  BlockTokenizer,
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseHook,
  EatingLineInfo,
  ResultOfEatAndInterruptPreviousSibling,
  ResultOfEatContinuationText,
  ResultOfEatOpener,
  ResultOfParse,
  YastBlockNode,
  YastBlockNodeType,
} from '@yozora/tokenizercore-block'
import type {
  ListItem as PS,
  ListItemMatchPhaseState as MS,
  ListItemPostMatchPhaseState as PMS,
  ListItemType as T,
} from './types'
import {
  AsciiCodePoint,
  VirtualCodePoint,
  isAsciiDigitCharacter,
  isSpaceCharacter,
} from '@yozora/character'
import { PhrasingContentType } from '@yozora/tokenizercore-block'
import { ListItemType, ListType } from './types'


/**
 * Params for constructing ListItemTokenizer
 */
export interface ListItemTokenizerProps {
  /**
   * YastNode types that can be interrupt by this BlockTokenizer,
   * used in couldInterruptPreviousSibling, you can overwrite that function to
   * mute this properties
   */
  readonly interruptableTypes?: YastBlockNodeType[]

  /**
   * Could not be interrupted types if current list-item is empty.
   */
  readonly emptyItemCouldNotInterruptedTypes?: YastBlockNodeType[]
}


/**
 * Lexical Analyzer for ListItem
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
export class ListItemTokenizer implements
  BlockTokenizer<T, MS, PMS>,
  BlockTokenizerMatchPhaseHook<T, MS>,
  BlockTokenizerParsePhaseHook<T, PMS, PS>
{
  public readonly name = 'ListItemTokenizer'
  public readonly getContext: BlockTokenizer['getContext'] = () => null

  public readonly isContainerBlock = true
  public readonly recognizedTypes: ReadonlyArray<T> = [ListItemType]
  public readonly interruptableTypes: ReadonlyArray<YastBlockNodeType>
  public readonly emptyItemCouldNotInterruptedTypes: ReadonlyArray<YastBlockNodeType>

  public constructor(props: ListItemTokenizerProps = {}) {
    this.interruptableTypes = Array.isArray(props.interruptableTypes)
      ? [...props.interruptableTypes]
      : [PhrasingContentType]
    this.emptyItemCouldNotInterruptedTypes =
      Array.isArray(props.emptyItemCouldNotInterruptedTypes)
        ? [...props.emptyItemCouldNotInterruptedTypes]
        : [PhrasingContentType]
  }

  /**
   * @override
   * @see BlockTokenizerMatchPhaseHook
   */
  public eatOpener(
    nodePoints: ReadonlyArray<NodePoint>,
    eatingInfo: EatingLineInfo,
  ): ResultOfEatOpener<T, MS> {
    /**
     * Four spaces are too much.
     * @see https://github.github.com/gfm/#example-253
     */
    if (eatingInfo.countOfPrecedeSpaces >= 4) return null

    const { startIndex, endIndex, firstNonWhitespaceIndex } = eatingInfo
    if (firstNonWhitespaceIndex >= endIndex) return null

    let listType: ListType | null = null
    let marker: number | null = null
    let order: number | undefined = void 0
    let i = firstNonWhitespaceIndex
    let c = nodePoints[i].codePoint

    /**
     * Try to resolve an ordered list-item.
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
        c = nodePoints[i].codePoint
        if (!isAsciiDigitCharacter(c)) break
        v = (v * 10) + c - AsciiCodePoint.DIGIT0
      }
      // eat '.' / ')'
      if (i > firstNonWhitespaceIndex && i - firstNonWhitespaceIndex <= 9) {
        if (
          c === AsciiCodePoint.DOT ||
          c === AsciiCodePoint.CLOSE_PARENTHESIS
        ) {
          i += 1
          listType = 'ordered'
          order = v
          marker = c
        }
      }
    }

    /**
     * Try to resolve a bullet list-item.
     *
     * A bullet list marker is a -, +, or * character.
     * @see https://github.github.com/gfm/#bullet-list-marker
     */
    if (listType == null) {
      if (
        c === AsciiCodePoint.PLUS_SIGN ||
        c === AsciiCodePoint.MINUS_SIGN ||
        c === AsciiCodePoint.ASTERISK
      ) {
        i += 1
        listType = 'bullet'
        marker = c
      }
    }

    if (marker == null || listType == null) return null

    /**
     * When the list-item mark followed by a tab, it is treated as if it were
     * expanded into three spaces.
     *
     * @see https://github.github.com/gfm/#example-7
     */
    let countOfSpaces = 0, nextIndex = i
    if (nextIndex < endIndex) {
      c = nodePoints[nextIndex].codePoint
      if (c === VirtualCodePoint.SPACE) nextIndex += 1
    }

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
    for (; nextIndex < endIndex; ++nextIndex) {
      c = nodePoints[nextIndex].codePoint
      if (!isSpaceCharacter(c)) break
      countOfSpaces += 1
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
    if (countOfSpaces > 4) {
      nextIndex -= countOfSpaces - 1
      countOfSpaces = 1
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
    if (
      countOfSpaces === 0 &&
      nextIndex < endIndex &&
      c !== VirtualCodePoint.LINE_END
    ) return null

    const countOfTopBlankLine = c === VirtualCodePoint.LINE_END ? 1 : -1
    if (c === VirtualCodePoint.LINE_END) {
      nextIndex -= countOfSpaces - 1
      countOfSpaces = 1
    }

    /**
     * Rule#4 Indentation.
     *
     * If a sequence of lines Ls constitutes a list item according to rule #1,
     * #2, or #3, then the result of indenting each line of Ls by 1-3 spaces
     * (the same for each line) also constitutes a list item with the same
     * contents and attributes. If a line is empty, then it need not be indented.
     */
    const indent = i - startIndex + countOfSpaces
    const state: MS = {
      type: ListItemType,
      listType,
      marker,
      order,
      indent,
      countOfTopBlankLine,
    }
    return { state, nextIndex }
  }

  /**
   * @override
   * @see BlockTokenizerMatchPhaseHook
   */
  public eatAndInterruptPreviousSibling(
    nodePoints: ReadonlyArray<NodePoint>,
    eatingInfo: EatingLineInfo,
    previousSiblingState: Readonly<BlockTokenizerMatchPhaseState>,
  ): ResultOfEatAndInterruptPreviousSibling<T, MS> {
    /**
     * ListItem can interrupt Paragraph
     * @see https://github.github.com/gfm/#list-items Basic case Exceptions 1
     */
    const result = this.eatOpener(nodePoints, eatingInfo)
    if (result == null) return null

    /**
     * But an empty list item cannot interrupt a paragraph
     * @see https://github.github.com/gfm/#example-263
     */
    if (this.emptyItemCouldNotInterruptedTypes.includes(previousSiblingState.type)) {
      if (result.state.indent === eatingInfo.endIndex - eatingInfo.startIndex) {
        return null
      }

      /**
       * In order to solve of unwanted lists in paragraphs with hard-wrapped
       * numerals, we allow only lists starting with 1 to interrupt paragraphs
       * @see https://github.github.com/gfm/#example-284
       */
      if (result.state.listType === 'ordered' && result.state.order !== 1) return null
    }
    return result
  }

  /**
   * @override
   * @see BlockTokenizerMatchPhaseHook
   */
  public eatContinuationText(
    nodePoints: ReadonlyArray<NodePoint>,
    eatingInfo: EatingLineInfo,
    state: MS,
  ): ResultOfEatContinuationText {
    const {
      startIndex,
      endIndex,
      firstNonWhitespaceIndex,
      countOfPrecedeSpaces: indent,
    } = eatingInfo

    /**
     * A list item can begin with at most one blank line
     * @see https://github.github.com/gfm/#example-258
     */
    if (firstNonWhitespaceIndex < endIndex && indent < state.indent) {
      return { status: 'notMatched' }
    }

    /**
     * When encountering a blank line, it consumes at most indent characters
     * and cannot exceed the newline character
     * @see https://github.github.com/gfm/#example-242
     * @see https://github.github.com/gfm/#example-298
     */
    if (firstNonWhitespaceIndex >= endIndex) {
      if (state.countOfTopBlankLine >= 0) {
        // eslint-disable-next-line no-param-reassign
        state.countOfTopBlankLine += 1
        if (state.countOfTopBlankLine > 1) {
          return { status: 'notMatched' }
        }
      }
    } else {
      // eslint-disable-next-line no-param-reassign
      state.countOfTopBlankLine = -1
    }

    const nextIndex = Math.min(startIndex + state.indent, endIndex - 1)
    return { status: 'opening', nextIndex }
  }

  /**
   * @override
   * @see BlockTokenizerParsePhaseHook
   */
  public parse(
    nodePoints: ReadonlyArray<NodePoint>,
    postMatchState: Readonly<PMS>,
    children?: YastBlockNode[],
  ): ResultOfParse<T, PS> {
    const state: PS = {
      type: postMatchState.type,
      marker: postMatchState.marker,
      order: postMatchState.order,
      children: children || [],
    }
    return { classification: 'flow', state }
  }
}
