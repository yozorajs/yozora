import type {
  BlockTokenizerPostMatchPhaseState,
  YastBlockNode,
} from '@yozora/tokenizercore-block'


/**
 * typeof ListTaskItem
 */
export const ListTaskItemType = 'LIST_TASK_ITEM'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ListTaskItemType = typeof ListTaskItemType


export const TaskListType = 'task'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type TaskListType = typeof TaskListType


/**
 * Status of a task.
 */
export enum TaskStatus {
  /**
   * To do, not yet started.
   */
  TODO = 'todo',
  /**
   * In progress.
   */
  DOING = 'doing',
  /**
   * Completed.
   */
  DONE = 'done',
}


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
export interface ListTaskItem extends YastBlockNode<ListTaskItemType> {
  /**
   * 列表类型
   * List type
   */
  listType: TaskListType
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
  children: YastBlockNode[]
}


/**
 * State on post-match phase of ListTaskItemTokenizer
 */
export type ListTaskItemPostMatchPhaseState =
  & BlockTokenizerPostMatchPhaseState<ListTaskItemType>
  & ListTaskItemMatchPhaseStateData


/**
 * State on post-match phase of ListTaskItemTokenizer
 */
export interface ListTaskItemMatchPhaseStateData {
  /**
   * 列表类型
   * List type
   */
  listType: TaskListType
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
 * Original State of post-match phase of ListTaskItemTokenizer
 */
export interface ListItemPostMatchPhaseState extends BlockTokenizerPostMatchPhaseState {
  /**
   * Type of the list
   */
  listType: TaskListType | string
  /**
   * Marker of bullet list-task-item, or a delimiter of ordered list-task-item
   */
  marker: number
  /**
   * Whether exists blank line in the list-task-item
   */
  spread: boolean
  /**
   * Whether the last line is blank line or not
   */
  isLastLineBlank: boolean
}
