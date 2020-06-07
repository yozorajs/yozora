import {
  BlockDataNode,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseState,
} from '@yozora/tokenizercore-block'


/**
 * typeof ListTaskItemDataNode
 */
export const ListTaskItemDataNodeType = 'LIST_TASK_ITEM'
export type ListTaskItemDataNodeType = typeof ListTaskItemDataNodeType


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
export interface ListTaskItemDataNode extends
  BlockDataNode<ListTaskItemDataNodeType>,
  BlockTokenizerParsePhaseState<ListTaskItemDataNodeType> {
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
  extends BlockTokenizerMatchPhaseState<ListTaskItemDataNodeType> {
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
  extends BlockTokenizerMatchPhaseState<ListTaskItemDataNodeType> {
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
