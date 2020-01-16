import { DataNodePhrasingContent, DataNodeParent } from '../_base'
import { InlineDataNode, InlineDataNodeType } from './_base'


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
export interface DeleteDataNode
  extends InlineDataNode<InlineDataNodeType.DELETE>, DataNodeParent {
  /**
   * 内联数据或者文本内容
   */
  children: DataNodePhrasingContent[]
}
