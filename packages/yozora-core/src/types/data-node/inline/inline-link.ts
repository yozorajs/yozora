import { InlineDataNodeType } from '../category'
import {
  DataNodeResource,
  DataNodeStaticPhrasingContent,
  DataNodeParent,
  InlineDataNode,
} from '../_base'


/**
 * data of InlineLinkDataNode
 */
export interface InlineLinkDataNodeData extends DataNodeResource, DataNodeParent {
  /**
   * 内联数据或者文本内容
   */
  children: DataNodeStaticPhrasingContent[]
}


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
 *      type: 'inline-link',
 *      url: 'https://example.com',
 *      title: 'bravo',
 *      children: [{ type: 'text', value: 'alpha' }]
 *    }
 *    ```
 * @see https://github.com/syntax-tree/mdast#link
 * @see https://github.github.com/gfm/#inline-link
 */
export type InlineLinkDataNode = InlineDataNode<
  InlineDataNodeType.INLINE_LINK, InlineLinkDataNodeData>
