import { DataNode, DataNodeParent } from '@yozora/tokenizer-core'


/**
 * typeof DeleteDataNode
 */
export const DeleteDataType = 'DELETE'
export type DeleteDataType = typeof DeleteDataType


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
 *      type: 'delete',
 *      children: [{ type: 'text', value: 'alpha' }]
 *    }
 *    ```
 * @see https://github.com/syntax-tree/mdast#delete
 */
export type DeleteDataNode = DataNode<DeleteDataType, DeleteDataNodeData>
