import { DataNodeResource, DataNodeStaticPhrasingContent, DataNodeParent } from '../_base'
import { InlineDataNode, InlineDataNodeType } from './_base'


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
export interface InlineLinkDataNode
  extends InlineDataNode<InlineDataNodeType.INLINE_LINK>, DataNodeResource, DataNodeParent {
  /**
   * 内联数据或者文本内容
   */
  children: DataNodeStaticPhrasingContent[]
}
