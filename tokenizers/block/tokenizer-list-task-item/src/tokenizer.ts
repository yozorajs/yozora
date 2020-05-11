import {
  BaseBlockTokenizer,
  BlockTokenizer,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseHook,
  BlockTokenizerPostMatchPhaseHook,
} from '@yozora/block-tokenizer-core'
import { AsciiCodePoint, isSpaceCharacter, isWhiteSpaceCharacter } from '@yozora/character'
import { DataNodeTokenPointDetail } from '@yozora/tokenizer-core'
import {
  ParagraphDataNodeType,
  ParagraphTokenizerMatchPhaseState,
} from '@yozora/tokenizer-paragraph'
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
    BlockTokenizerPostMatchPhaseHook<T, ListItemTokenizerMatchPhaseState, ListTaskItemTokenizerPostMatchPhaseState>,
    BlockTokenizerParsePhaseHook<T, ListTaskItemTokenizerPostMatchPhaseState, ListTaskItemDataNode>
{
  public readonly name = 'ListTaskItemTokenizer'
  public readonly uniqueTypes: T[] = [ListTaskItemDataNodeType]

  /**
   * hook of @BlockTokenizerPostMatchPhaseHook
   */
  public transformMatch(
    originalMatchPhaseState: Readonly<ListItemTokenizerMatchPhaseState>,
  ): { nextState: ListTaskItemTokenizerPostMatchPhaseState, final: false } | null {
    // Not a list item
    if (typeof originalMatchPhaseState.listType !== 'string') return null

    // Ignore task list item
    if (originalMatchPhaseState.listType === 'task') return null

    /**
     * A task list item is a list item where the first block in it is a
     * paragraph which begins with a task list item marker and at least
     * one whitespace character before any other content.
     * @see https://github.github.com/gfm/#task-list-item
     */
    if (
      originalMatchPhaseState.children == null
      || originalMatchPhaseState.children.length <= 0) {
      return null
    }
    const firstChild = originalMatchPhaseState.children[0] as ParagraphTokenizerMatchPhaseState
    if (firstChild.type !== ParagraphDataNodeType) return null

    /**
     * A task list item marker consists of an optional number of spaces,
     * a left bracket ([), either a whitespace character or the letter x
     * in either lowercase or uppercase, and then a right bracket (]).
     */
    let i = 0, c: DataNodeTokenPointDetail = firstChild.content[0]
    for (; i < firstChild.content.length; ++i) {
      c = firstChild.content[i]
      if (!isSpaceCharacter(c.codePoint)) break
    }
    if (i + 3 >= firstChild.content.length
      || c.codePoint !== AsciiCodePoint.OPEN_BRACKET
      || firstChild.content[i + 2].codePoint !== AsciiCodePoint.CLOSE_BRACKET
      || !isWhiteSpaceCharacter(firstChild.content[i + 3].codePoint)
    ) {
      return null
    }

    let status: TaskStatus
    switch (firstChild.content[i + 1].codePoint) {
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

    firstChild.content = firstChild.content.slice(i + 4)
    const state: ListTaskItemTokenizerPostMatchPhaseState = {
      type: ListTaskItemDataNodeType,
      classify: 'flow',
      listType: 'task',
      marker: 0,
      status,
      indent: originalMatchPhaseState.indent,
      spread: originalMatchPhaseState.spread,
      isLastLineBlank: originalMatchPhaseState.isLastLineBlank,
      children: originalMatchPhaseState.children,
    }
    return { nextState: state, final: false }
  }

  /**
   * hook of @BlockTokenizerParseFlowPhaseHook
   */
  public parseFlow(
    matchPhaseState: ListTaskItemTokenizerPostMatchPhaseState,
  ): ListTaskItemDataNode {
    return {
      type: matchPhaseState.type,
      data: {
        listType: matchPhaseState.listType,
        marker: matchPhaseState.marker,
        status: matchPhaseState.status,
      },
    }
  }
}
