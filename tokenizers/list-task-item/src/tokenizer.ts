import type { NodePoint } from '@yozora/character'
import type { YastNode } from '@yozora/tokenizercore'
import type {
  BlockTokenizer,
  BlockTokenizerParsePhaseHook,
  BlockTokenizerPostMatchPhaseHook,
  BlockTokenizerPostMatchPhaseState,
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
import { AsciiCodePoint, isWhitespaceCharacter } from '@yozora/character'
import { ListTaskItemType, TaskListType, TaskStatus } from './types'


/**
 * Params for constructing ListTaskItemTokenizer
 */
export interface ListTaskItemTokenizerProps {

}


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
export class ListTaskItemTokenizer implements
  BlockTokenizer<T, MS, PMS>,
  BlockTokenizerPostMatchPhaseHook,
  BlockTokenizerParsePhaseHook<T, PMS, PS>
{
  public readonly name = 'ListTaskItemTokenizer'
  public readonly getContext: BlockTokenizer['getContext'] = () => null

  public readonly recognizedTypes: ReadonlyArray<T> = [ListTaskItemType]

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public constructor(props: ListTaskItemTokenizerProps = {}) {
  }

  /**
   * @override
   * @see BlockTokenizerPostMatchPhaseHook
   */
  public transformMatch(
    states: ReadonlyArray<BlockTokenizerPostMatchPhaseState>,
    nodePoints: ReadonlyArray<NodePoint>,
  ): BlockTokenizerPostMatchPhaseState[] {
    // Check if the context exists.
    const context = this.getContext()
    if (context == null) {
      return states as BlockTokenizerPostMatchPhaseState[]
    }

    const results = states.map(
      (x): BlockTokenizerPostMatchPhaseState=> {
        const t = this._transformMatch(
          nodePoints, context, x as ListItemPostMatchPhaseState)
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
    state: Readonly<PMS>,
    children?: YastNode[],
  ): ResultOfParse<T, PS> {
    const node: PS = {
      type: state.type,
      marker: state.marker,
      status: state.status,
      children: children || [],
    }
    return { classification: 'flow', node }
  }

  /**
   * Perform transform on a single ListItemPostMatchPhaseState
   */
  protected _transformMatch(
    nodePoints: ReadonlyArray<NodePoint>,
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
    let lineIndex = 0, c: NodePoint | null = null
    for (; lineIndex < lines.length; ++lineIndex) {
      const line = lines[lineIndex]
      const { firstNonWhitespaceIndex, endIndex } = line

      // ignore blank line
      if (firstNonWhitespaceIndex >= endIndex) continue

      // Must have 3 non-whitespace characters and 1 whitespace
      if (firstNonWhitespaceIndex + 3 >= endIndex) return null

      const i = firstNonWhitespaceIndex
      if (
        i + 3 >= endIndex ||
        nodePoints[i].codePoint !== AsciiCodePoint.OPEN_BRACKET ||
        nodePoints[i + 2].codePoint !== AsciiCodePoint.CLOSE_BRACKET ||
        !isWhitespaceCharacter(nodePoints[i + 3].codePoint)
      ) return null

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
      case AsciiCodePoint.LOWERCASE_X:
      case AsciiCodePoint.UPPERCASE_X:
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
    const nextStartIndex = firstLine.firstNonWhitespaceIndex + 4
    let nextFirstNonWhitespaceIndex = nextStartIndex
    for (; nextFirstNonWhitespaceIndex < firstLine.endIndex;) {
      const p = nodePoints[nextFirstNonWhitespaceIndex]
      if (!isWhitespaceCharacter(p.codePoint)) break
      nextFirstNonWhitespaceIndex += 1
    }
    remainLines[0] = {
      nodePoints,
      startIndex: nextStartIndex,
      endIndex: firstLine.endIndex,
      firstNonWhitespaceIndex: nextFirstNonWhitespaceIndex,
    }

    const nextChildren = originalState.children.slice(1)
    const firstChild: BlockTokenizerPostMatchPhaseState | null = context
      .buildPostMatchPhaseState(remainLines, originalFirstChild)
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
