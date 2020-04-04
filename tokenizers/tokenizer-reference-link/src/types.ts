import { InlineDataNode, DataNodeAssociation, DataNodeParent } from '@yozora/tokenizer-core'
import { ReferenceLinkDataNodeType } from '@yozora/tokenizer-link'
export { LinkDataNodeType, ReferenceLinkDataNodeType } from '@yozora/tokenizer-link'


/**
 * data of ReferenceLinkDataNode
 */
export interface ReferenceLinkDataNodeData extends DataNodeAssociation, DataNodeParent {

}


/**
 * 通过关联关系来指定的超链接
 * LinkReference represents a hyperlink through association, or its original source if there is no association.
 *
 * @example
 *    ````markdown
 *    [alpha][Bravo]
 *    ````
 *    ===>
 *    ```js
 *    {
 *      type: 'REFERENCE_LINK',
 *      identifier: 'bravo',
 *      label: 'Bravo',
 *      children: [{ type: 'TEXT', value: 'alpha' }]
 *    }
 *    ```
 * @see https://github.com/syntax-tree/mdast#linkreference
 * @see https://github.github.com/gfm/#reference-link
 */
export type ReferenceLinkDataNode = InlineDataNode<ReferenceLinkDataNodeType, ReferenceLinkDataNodeData>
