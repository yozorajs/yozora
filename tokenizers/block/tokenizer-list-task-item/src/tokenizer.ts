import { AsciiCodePoint, isWhiteSpaceCharacter } from '@yozora/character'
import {
  ParagraphDataNodeType,
  ParagraphTokenizerMatchPhaseState,
} from '@yozora/tokenizer-paragraph'
import { DataNodeTokenPointDetail } from '@yozora/tokenizercore'
import {
  BaseBlockTokenizer,
  BlockTokenizer,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseHook,
  BlockTokenizerParsePhaseState,
  BlockTokenizerPostMatchPhaseHook,
  BlockTokenizerPreParsePhaseState,
} from '@yozora/tokenizercore-block'
import {
  ListTaskItemDataNode,
  ListTaskItemDataNodeType,
  ListType,
  TaskStatus,
} from './types'


type T = ListTaskItemDataNodeType


/**
 * Original State of post-match phase of ListTaskItemTokenizer
 */
export interface ListItemTokenizerMatchPhaseState
  extends BlockTokenizerMatchPhaseState<T> {
  /**
   * 列表类型
   * List type
   */
  listType: ListType | string
  /**
   * 标记或分隔符
   * Marker of bullet list-task-item, and delimiter of ordered list-task-item
   */
  marker: number
  /**
   * 缩进
   * Indent of list-task-item
   */
  indent: number
  /**
   * Whether exists blank line in the list-task-item
   */
  spread: boolean
  /**
   * 最后一行是否为空行
   * Whether the last line is blank line or not
   */
  isLastLineBlank: boolean
}


/**
 * State of post-match phase of ListTaskItemTokenizer
 */
export interface ListTaskItemTokenizerPostMatchPhaseState
  extends BlockTokenizerMatchPhaseState<T> {
  /**
   * 列表类型
   * List type
   */
  listType: ListType
  /**
   * 标记或分隔符
   * Marker of bullet list-task-item, and delimiter of ordered list-task-item
   */
  marker: number
  /**
   * 任务的状态
   * Status of Task
   */
  status: TaskStatus
  /**
   * 缩进
   * Indent of list-ordered-item
   */
  indent: number
  /**
   * Whether exists blank line in the list-task-item
   */
  spread: boolean
  /**
   * 最后一行是否为空行
   * Whether the last line is blank line or not
   */
  isLastLineBlank: boolean
}


/**
 * Lexical Analyzer for ListTaskItemDataNode
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
export class ListTaskItemTokenizer extends BaseBlockTokenizer<T>
  implements
    BlockTokenizer<T>,
    BlockTokenizerPostMatchPhaseHook,
    BlockTokenizerParsePhaseHook<
      T,
      ListTaskItemTokenizerPostMatchPhaseState,
      ListTaskItemDataNode>
{
  public readonly name = 'ListTaskItemTokenizer'
  public readonly uniqueTypes: T[] = [ListTaskItemDataNodeType]

  /**
   * hook of @BlockTokenizerPostMatchPhaseHook
   */
  public transformMatch(
    matchPhaseStates: Readonly<BlockTokenizerMatchPhaseState[]>,
  ): BlockTokenizerMatchPhaseState[] {
    const self = this
    const results = matchPhaseStates.map((x): BlockTokenizerMatchPhaseState => {
      const t = self._transformMatch(x as ListItemTokenizerMatchPhaseState)
      return t == null ? x : t
    })
    return results
  }

  /**
   * hook of @BlockTokenizerParsePhaseHook
   */
  public parseFlow(
    matchPhaseState: ListTaskItemTokenizerPostMatchPhaseState,
    preParsePhaseState: BlockTokenizerPreParsePhaseState,
    children?: BlockTokenizerParsePhaseState[],
  ): ListTaskItemDataNode {
    const result: ListTaskItemDataNode = {
      type: matchPhaseState.type,
      listType: matchPhaseState.listType,
      marker: matchPhaseState.marker,
      status: matchPhaseState.status,
      children: children || [],
    }
    return result
  }

  /**
   * Perform transform on single BlockTokenizerMatchPhaseState
   * @returns
   *  - `null`: Do nothing
   *  - `ListTaskItemTokenizerPostMatchPhaseState`: Replace original one
   */
  protected _transformMatch(
    matchPhaseStates: Readonly<ListItemTokenizerMatchPhaseState>,
  ): ListTaskItemTokenizerPostMatchPhaseState | null {
    // Not a list item
    if (typeof matchPhaseStates.listType !== 'string') return null

    // Ignore task list item
    if (matchPhaseStates.listType === 'task') return null

    /**
     * A task list item is a list item where the first block in it is a
     * paragraph which begins with a task list item marker and at least
     * one whitespace character before any other content.
     * @see https://github.github.com/gfm/#task-list-item
     */
    if (
      matchPhaseStates.children == null
      || matchPhaseStates.children.length <= 0) {
      return null
    }
    const originalParagraph = matchPhaseStates.children[0] as ParagraphTokenizerMatchPhaseState
    if (originalParagraph.type !== ParagraphDataNodeType) return null
    const originalPhrasingContent = originalParagraph.children[0]

    /**
     * A task list item marker consists of an optional number of spaces,
     * a left bracket ([), either a whitespace character or the letter x
     * in either lowercase or uppercase, and then a right bracket (]).
     */
    let lineIndex = 0, c: DataNodeTokenPointDetail | null = null
    for (; lineIndex < originalPhrasingContent.lines.length; ++lineIndex) {
      const line = originalPhrasingContent.lines[lineIndex]
      const { firstNonWhiteSpaceIndex, codePositions } = line

      // ignore blank line
      if (firstNonWhiteSpaceIndex >= codePositions.length) continue

      // Must have 3 non-whitespace characters and 1 whitespace
      if (firstNonWhiteSpaceIndex + 3 >= codePositions.length) return null

      const i = firstNonWhiteSpaceIndex
      if (i + 3 >= codePositions.length
        || codePositions[i].codePoint !== AsciiCodePoint.OPEN_BRACKET
        || codePositions[i + 2].codePoint !== AsciiCodePoint.CLOSE_BRACKET
        || !isWhiteSpaceCharacter(codePositions[i + 3].codePoint)
      ) {
        return null
      }

      c = codePositions[i + 1]
      break
    }

    // Not matched task item
    if (c == null) return null

    let status: TaskStatus
    switch (c.codePoint) {
      case AsciiCodePoint.SPACE:
        status = 'todo'
        break
      case AsciiCodePoint.MINUS_SIGN:
        status = 'doing'
        break
      case AsciiCodePoint.LOWERCASE_LETTER_X:
      case AsciiCodePoint.UPPERCASE_LETTER_X:
        status = 'done'
        break
      default:
        return null
    }

    /**
     * Remove consumed characters by TaskItem from PhrasingContent
     *
     * As the `transformMatch` running under the immer.produce,
     * so we can modify the phrasingContent directly
     */
    originalPhrasingContent.lines = originalPhrasingContent.lines.slice(lineIndex)
    const firstLine = originalPhrasingContent.lines[0]
    const nextStartIndex = firstLine.firstNonWhiteSpaceIndex + 4
    let nextFirstNonWhiteSpaceIndex = nextStartIndex
    for (; nextFirstNonWhiteSpaceIndex < firstLine.codePositions.length;) {
      const c = firstLine.codePositions[nextFirstNonWhiteSpaceIndex]
      if (!isWhiteSpaceCharacter(c.codePoint)) break
      ++nextFirstNonWhiteSpaceIndex
    }
    originalPhrasingContent.lines[0] = {
      codePositions: firstLine.codePositions.slice(nextStartIndex),
      firstNonWhiteSpaceIndex: nextFirstNonWhiteSpaceIndex - nextStartIndex,
    }

    const state: ListTaskItemTokenizerPostMatchPhaseState = {
      type: ListTaskItemDataNodeType,
      classify: 'flow',
      listType: 'task',
      marker: 0,
      status,
      indent: matchPhaseStates.indent,
      spread: matchPhaseStates.spread,
      isLastLineBlank: matchPhaseStates.isLastLineBlank,
      children: matchPhaseStates.children,
    }
    return state
  }
}
