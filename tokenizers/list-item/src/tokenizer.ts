import type { NodePoint } from '@yozora/character'
import type {
  PhrasingContentLine,
  ResultOfEatAndInterruptPreviousSibling,
  ResultOfEatContinuationText,
  ResultOfEatOpener,
  ResultOfParse,
  Tokenizer,
  TokenizerMatchBlockHook,
  TokenizerParseBlockHook,
  YastBlockState,
  YastNode,
  YastNodeType,
} from '@yozora/tokenizercore'
import type {
  ListItem as Node,
  ListItemState as State,
  ListItemType as T,
} from './types'
import {
  AsciiCodePoint,
  VirtualCodePoint,
  isAsciiDigitCharacter,
  isSpaceCharacter,
  isWhitespaceCharacter,
} from '@yozora/character'
import {
  PhrasingContentType,
  calcEndYastNodePoint,
  calcStartYastNodePoint,
} from '@yozora/tokenizercore'
import { ListItemType, TaskStatus } from './types'


/**
 * Params for constructing ListItemTokenizer
 */
export interface ListItemTokenizerProps {
  /**
   * Specify an array of YastNode types that can be interrupted by this
   * Tokenizer on match phase.
   */
  readonly interruptableTypes?: YastNodeType[]

  /**
   * Specify an array of YastNode types that could not be interrupted
   * by this Tokenizer if the current list-item is empty.
   * @see https://github.github.com/gfm/#example-263
   */
  readonly emptyItemCouldNotInterruptedTypes?: YastNodeType[]

  /**
   * Should enable task list item (extension).
   */
  readonly enableTaskListItem?: boolean
}


/**
 * Lexical Analyzer for ListItem.
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
 *
 * @see https://github.com/syntax-tree/mdast#listitem
 * @see https://github.github.com/gfm/#list-items
 */
export class ListItemTokenizer implements
  Tokenizer<T>,
  TokenizerMatchBlockHook<T, State>,
  TokenizerParseBlockHook<T, State, Node>
{
  public readonly name: string = ListItemTokenizer.name
  public readonly recognizedTypes: ReadonlyArray<T> = [ListItemType]
  public readonly getContext: Tokenizer['getContext'] = () => null

  public readonly isContainerBlock = true
  public readonly interruptableTypes: ReadonlyArray<YastNodeType>

  public readonly enableTaskListItem: boolean
  public readonly emptyItemCouldNotInterruptedTypes: ReadonlyArray<YastNodeType>

  /* istanbul ignore next */
  public constructor(props: ListItemTokenizerProps = {}) {
    this.enableTaskListItem = props.enableTaskListItem != null
      ? props.enableTaskListItem
      : false

    this.emptyItemCouldNotInterruptedTypes =
      Array.isArray(props.emptyItemCouldNotInterruptedTypes)
        ? [...props.emptyItemCouldNotInterruptedTypes]
        : [PhrasingContentType]

    this.interruptableTypes = Array.isArray(props.interruptableTypes)
      ? [...props.interruptableTypes]
      : [PhrasingContentType]
  }

  /**
   * @override
   * @see TokenizerMatchBlockHook
   */
  public eatOpener(line: Readonly<PhrasingContentLine>): ResultOfEatOpener<T, State> {
    /**
     * Four spaces are too much.
     * @see https://github.github.com/gfm/#example-253
     */
    if (line.countOfPrecedeSpaces >= 4) return null

    const { nodePoints, startIndex, endIndex, firstNonWhitespaceIndex } = line
    if (firstNonWhitespaceIndex >= endIndex) return null

    let listType: State['listType'] | null = null
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

    // Try to resolve task status.
    let status: TaskStatus | null = null
    if (this.enableTaskListItem) {
      ({ status, nextIndex } = this.eatTaskStatus(nodePoints, nextIndex, endIndex))
    }

    const state: State = {
      type: ListItemType,
      position: {
        start: calcStartYastNodePoint(nodePoints, startIndex),
        end: calcEndYastNodePoint(nodePoints, nextIndex - 1),
      },
      listType,
      marker,
      order,
      indent,
      countOfTopBlankLine,
      children: [],
    }

    if (status != null) state.status = status
    return { state, nextIndex }
  }

  /**
   * @override
   * @see TokenizerMatchBlockHook
   */
  public eatAndInterruptPreviousSibling(
    line: Readonly<PhrasingContentLine>,
    previousSiblingState: Readonly<YastBlockState>,
  ): ResultOfEatAndInterruptPreviousSibling<T, State> {
    /**
     * ListItem can interrupt Paragraph
     * @see https://github.github.com/gfm/#list-items Basic case Exceptions 1
     */
    const result = this.eatOpener(line)
    if (result == null) return null
    const { state, nextIndex } = result

    /**
     * But an empty list item cannot interrupt a paragraph
     * @see https://github.github.com/gfm/#example-263
     */
    if (this.emptyItemCouldNotInterruptedTypes.includes(previousSiblingState.type)) {
      if (state.indent === line.endIndex - line.startIndex) {
        return null
      }

      /**
       * In order to solve of unwanted lists in paragraphs with hard-wrapped
       * numerals, we allow only lists starting with 1 to interrupt paragraphs
       * @see https://github.github.com/gfm/#example-284
       */
      if (state.listType === 'ordered' && state.order !== 1) return null
    }

    return { state, nextIndex, remainingSibling: previousSiblingState }
  }

  /**
   * @override
   * @see TokenizerMatchBlockHook
   */
  public eatContinuationText(
    line: Readonly<PhrasingContentLine>,
    state: State,
  ): ResultOfEatContinuationText {
    const {
      startIndex,
      endIndex,
      firstNonWhitespaceIndex,
      countOfPrecedeSpaces: indent,
    } = line

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
   * @see TokenizerParseBlockHook
   */
  public parse(
    state: Readonly<State>,
    children?: YastNode[],
  ): ResultOfParse<Node> {
    const node: Node = {
      type: state.type,
      marker: state.marker,
      order: state.order,
      status: state.status,
      children: children || [],
    }
    return { classification: 'flow', node }
  }

  /**
   * A task list item is a list item where the first block in it is a paragraph
   * which begins with a task list item marker and at least one whitespace
   * character before any other content.
   *
   * A task list item marker consists of an optional number of spaces, a left
   * bracket ([), either a whitespace character or the letter x in either
   * lowercase or uppercase, and then a right bracket (]).
   *
   * @param nodePoints
   * @param startIndex
   * @param endIndex
   * @see https://github.github.com/gfm/#task-list-item
   */
  protected eatTaskStatus(
    nodePoints: ReadonlyArray<NodePoint>,
    startIndex: number,
    endIndex: number,
  ): { status: TaskStatus | null, nextIndex: number } {
    let i = startIndex
    for (; i < endIndex; ++i) {
      const c = nodePoints[i].codePoint
      if (!isSpaceCharacter(c)) break
    }

    if (
      i + 3 >= endIndex ||
      nodePoints[i].codePoint !== AsciiCodePoint.OPEN_BRACKET ||
      nodePoints[i + 2].codePoint !== AsciiCodePoint.CLOSE_BRACKET ||
      !isWhitespaceCharacter(nodePoints[i + 3].codePoint)
    ) return { status: null, nextIndex: startIndex }

    let status: TaskStatus | undefined
    const c = nodePoints[i + 1].codePoint
    switch (c) {
      case AsciiCodePoint.SPACE:
        status = TaskStatus.TODO
        break
      case AsciiCodePoint.MINUS_SIGN:
        status = TaskStatus.DOING
        break
      case AsciiCodePoint.LOWERCASE_X:
      case AsciiCodePoint.UPPERCASE_X:
        status = TaskStatus.DONE
        break
      default:
        return { status: null, nextIndex: startIndex }
    }
    return { status, nextIndex: i + 4 }
  }
}
