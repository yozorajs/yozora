import { DataNode, DataNodeParent } from '@yozora/tokenizer-core'


/**
 * typeof DeleteDataNode
 */
export const DeleteDataNodeType = 'DELETE'
export type DeleteDataNodeType = typeof DeleteDataNodeType


/**
 * data of DeleteDataNode
 */
export interface DeleteDataNodeData extends DataNodeParent {

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
 *      type: 'DELETE',
 *      children: [{ type: 'TEXT', value: 'alpha' }]
 *    }
 *    ```
 * @see https://github.com/syntax-tree/mdast#delete
 */
export type DeleteDataNode = DataNode<DeleteDataNodeType, DeleteDataNodeData>
