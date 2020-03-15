import { InlineDataNodeType } from '../category'
import { DataNodePhrasingContent, DataNodeParent, InlineDataNode } from '../_base'


/**
 * data of DeleteDataNode
 */
export interface DeleteDataNodeData extends DataNodeParent {
  /**
   * 内联数据或者文本内容
   */
  children: DataNodePhrasingContent[]
}


/**
 * 删除线
 * Delete represents contents that are no longer accurate or no longer relevant.
 *
 * @example
 *    ````markdown
 *    ~~alpha~~
 *    ````
 *    ===>
 *    ```js
 *    {
 *      type: 'delete',
 *      children: [{ type: 'text', value: 'alpha' }]
 *    }
 *    ```
 * @see https://github.com/syntax-tree/mdast#delete
 */
export type DeleteDataNode = InlineDataNode<
  InlineDataNodeType.DELETE, DeleteDataNodeData>
