import { DataNodeAssociation, DataNodeStaticPhrasingContent, DataNodeParent  } from '../_base'
import { InlineDataNode, InlineDataNodeType} from './_base'


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
 *      type: 'reference-link',
 *      identifier: 'bravo',
 *      label: 'Bravo',
 *      children: [{ type: 'text', value: 'alpha' }]
 *    }
 *    ```
 * @see https://github.com/syntax-tree/mdast#linkreference
 * @see https://github.github.com/gfm/#reference-link
 */
export interface LinkReferenceDataNode
  extends InlineDataNode<InlineDataNodeType.REFERENCE_LINK>, DataNodeAssociation, DataNodeParent {
  /**
   * 内联数据或者文本内容
   */
  children: DataNodeStaticPhrasingContent[]
}
