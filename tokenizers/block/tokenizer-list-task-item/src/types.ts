import {
  BlockDataNode,
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
