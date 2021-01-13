import type { EnhancedYastNodePoint } from '@yozora/tokenizercore'
import type {
  BlockTokenizer,
  BlockTokenizerParsePhaseHook,
  BlockTokenizerParsePhaseState,
  BlockTokenizerPostMatchPhaseHook,
  BlockTokenizerPostMatchPhaseState,
  BlockTokenizerProps,
  ImmutableBlockTokenizerContext,
  ResultOfParse,
} from '@yozora/tokenizercore-block'
import type {
  ListItemPostMatchPhaseState,
  ListTaskItem as PS,
  ListTaskItemMatchPhaseState as MS,
  ListTaskItemPostMatchPhaseState as PMS,
  ListTaskItemType as T,
} from './types'
import { AsciiCodePoint, isWhiteSpaceCharacter } from '@yozora/character'
import { BaseBlockTokenizer } from '@yozora/tokenizercore-block'
import { ListTaskItemType, TaskListType, TaskStatus } from './types'


/**
 * Lexical Analyzer for ListTaskItem
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
 * A task list item is a list item where the first block in it is a paragraph
 * which begins with a task list item marker and at least one whitespace
 * character before any other content.
 * @see https://github.github.com/gfm/#list-marker
 * @see https://github.github.com/gfm/#task-list-item
 */
export class ListTaskItemTokenizer extends BaseBlockTokenizer<T, MS, PMS> implements
  BlockTokenizer<T, MS, PMS>,
  BlockTokenizerPostMatchPhaseHook,
  BlockTokenizerParsePhaseHook<T, PMS, PS>
{
  public readonly name = 'ListTaskItemTokenizer'
  public readonly uniqueTypes: T[] = [ListTaskItemType]

  public constructor(props: BlockTokenizerProps) {
    super({
      ...props,
      interruptableTypes: props.interruptableTypes || [],
    })
  }

  /**
   * @override
   * @see BlockTokenizerPostMatchPhaseHook
   */
  public transformMatch(
    states: ReadonlyArray<BlockTokenizerPostMatchPhaseState>,
  ): BlockTokenizerPostMatchPhaseState[] {
    // Check if the context exists.
    const context = this.getContext()
    if (context == null) {
      return states as BlockTokenizerPostMatchPhaseState[]
    }

    const results = states.map(
      (x): BlockTokenizerPostMatchPhaseState=> {
        const t = this._transformMatch(context, x as ListItemPostMatchPhaseState)
        return t == null ? x : t
      }
    )
    return results
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
      status: postMatchState.status,
      children: children || [],
    }
    return { classification: 'flow', state }
  }

  /**
   * Perform transform on a single ListItemPostMatchPhaseState
   */
  protected _transformMatch(
    context: ImmutableBlockTokenizerContext,
    originalState: Readonly<ListItemPostMatchPhaseState>,
  ): BlockTokenizerPostMatchPhaseState | null {
    // Not a list item
    if (typeof originalState.listType !== 'string') return null

    // Ignore task list item
    if (originalState.listType === TaskListType) return null

    /**
     * A task list item is a list item where the first block in it is a
     * paragraph which begins with a task list item marker and at least
     * one whitespace character before any other content.
     * @see https://github.github.com/gfm/#task-list-item
     */
    if (
      originalState.children == null ||
      originalState.children.length <= 0
    ) return null

    const originalFirstChild = originalState.children[0]
    const lines = context.extractPhrasingContentLines(originalFirstChild)
    if (lines == null) return null

    /**
     * A task list item marker consists of an optional number of spaces,
     * a left bracket ([), either a whitespace character or the letter x
     * in either lowercase or uppercase, and then a right bracket (]).
     */
    let lineIndex = 0, c: EnhancedYastNodePoint | null = null
    for (; lineIndex < lines.length; ++lineIndex) {
      const line = lines[lineIndex]
      const { firstNonWhiteSpaceIndex, nodePoints } = line

      // ignore blank line
      if (firstNonWhiteSpaceIndex >= nodePoints.length) continue

      // Must have 3 non-whitespace characters and 1 whitespace
      if (firstNonWhiteSpaceIndex + 3 >= nodePoints.length) return null

      const i = firstNonWhiteSpaceIndex
      if (i + 3 >= nodePoints.length
        || nodePoints[i].codePoint !== AsciiCodePoint.OPEN_BRACKET
        || nodePoints[i + 2].codePoint !== AsciiCodePoint.CLOSE_BRACKET
        || !isWhiteSpaceCharacter(nodePoints[i + 3].codePoint)
      ) {
        return null
      }

      c = nodePoints[i + 1]
      break
    }

    // Not matched task item
    if (c == null) return null

    let status: TaskStatus
    switch (c.codePoint) {
      case AsciiCodePoint.SPACE:
        status = TaskStatus.TODO
        break
      case AsciiCodePoint.MINUS_SIGN:
        status = TaskStatus.DOING
        break
      case AsciiCodePoint.LOWERCASE_LETTER_X:
      case AsciiCodePoint.UPPERCASE_LETTER_X:
        status = TaskStatus.DONE
        break
      default:
        return null
    }

    /**
     * Remove consumed characters by TaskItem from PhrasingContent
     */
    const remainLines = lines.slice(lineIndex)
    const firstLine = remainLines[0]
    const nextStartIndex = firstLine.firstNonWhiteSpaceIndex + 4
    let nextFirstNonWhiteSpaceIndex = nextStartIndex
    for (; nextFirstNonWhiteSpaceIndex < firstLine.nodePoints.length;) {
      const c = firstLine.nodePoints[nextFirstNonWhiteSpaceIndex]
      if (!isWhiteSpaceCharacter(c.codePoint)) break
      nextFirstNonWhiteSpaceIndex += 1
    }
    remainLines[0] = {
      nodePoints: firstLine.nodePoints.slice(nextStartIndex),
      firstNonWhiteSpaceIndex: nextFirstNonWhiteSpaceIndex - nextStartIndex,
    }

    const nextChildren = originalState.children.slice(1)
    const firstChild: BlockTokenizerPostMatchPhaseState | null = context
      .buildPostMatchPhaseState(originalFirstChild, remainLines)
    if (firstChild != null) {
      nextChildren.unshift(firstChild)
    }

    const state: PMS = {
      type: ListTaskItemType,
      listType: TaskListType,
      marker: 0,
      status,
      position: { ...originalState.position },
      children: nextChildren,
    }
    return state
  }
}
