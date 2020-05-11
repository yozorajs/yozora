import {
  BlockDataNode,
  BlockTokenizerParsePhaseState,
} from '@yozora/block-tokenizer-core'


/**
 * typeof ListTaskItemDataNode
 */
export const ListTaskItemDataNodeType = 'LIST_TASK_ITEM'
export type ListTaskItemDataNodeType = typeof ListTaskItemDataNodeType


export type ListType = 'task'
export type TaskStatus = 'todo' | 'doing' | 'done'


/**
 * data of ListTaskItemDataNode
 */
export interface ListTaskItemDataNodeData {
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
export type ListTaskItemDataNode =
  & BlockTokenizerParsePhaseState<ListTaskItemDataNodeType>
  & BlockDataNode<ListTaskItemDataNodeType, ListTaskItemDataNodeData>
