import type {
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseState,
  YastBlockNode,
} from '@yozora/tokenizercore-block'


/**
 * typeof ListTaskItem
 */
export const ListTaskItemType = 'LIST_TASK_ITEM'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ListTaskItemType = typeof ListTaskItemType


export type ListType = 'task'
export type TaskStatus = 'todo' | 'doing' | 'done'


/**
 * 列表项
 * ListTaskItem (Parent) represents an item in a List.
 *
 * @example
 *    ````markdown
 *    ````
 *    ===>
 *    ```js
 *    ```
 * @see https://github.com/syntax-tree/mdast#listitem
 * @see https://github.github.com/gfm/#list-items
 */
export interface ListTaskItem extends
  YastBlockNode<ListTaskItemType>,
  BlockTokenizerParsePhaseState<ListTaskItemType> {
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
   * ListTaskItems are container block
   */
  children: BlockTokenizerParsePhaseState[]
}


/**
 * Original State of post-match phase of ListTaskItemTokenizer
 */
export interface ListItemMatchPhaseState
  extends BlockTokenizerMatchPhaseState<ListTaskItemType> {
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
export interface ListTaskItemPostMatchPhaseState
  extends BlockTokenizerMatchPhaseState<ListTaskItemType> {
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
