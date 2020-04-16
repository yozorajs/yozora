import {
  DataNodeParent,
  DataNodeResource,
  InlineDataNode,
} from '@yozora/tokenizer-core'


/**
 * typeof LinkDataNode
 */
export const LinkDataNodeType = 'LINK'
export type LinkDataNodeType = typeof LinkDataNodeType


/**
 * data of LinkDataNode
 */
export interface LinkDataNodeData extends DataNodeResource, DataNodeParent {

}


/**
 * typeof ReferenceLinkDataNode
 */
export const ReferenceLinkDataNodeType = 'REFERENCE_LINK'
export type ReferenceLinkDataNodeType = typeof ReferenceLinkDataNodeType


/**
 * 超链接
 * Link represents a hyperlink.
 *
 * @example
 *    ````markdown
 *    [alpha](https://example.com "bravo")
 *    ````
 *    ===>
 *    ```js
 *    {
 *      type: 'LINK',
 *      url: 'https://example.com',
 *      title: 'bravo',
 *      children: [{ type: 'TEXT', value: 'alpha' }]
 *    }
 *    ```
 * @see https://github.com/syntax-tree/mdast#link
 * @see https://github.github.com/gfm/#inline-link
 */
export type LinkDataNode = InlineDataNode<LinkDataNodeType, LinkDataNodeData>
