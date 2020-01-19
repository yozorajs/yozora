import { DataNodeAlternative } from '../_base'
import { InlineDataNode, InlineDataNodeType } from './_base'


/**
 * 图片引用
 * @example
 *    ````markdown
 *    ![alpha][bravo]
 *    ````
 *    ==>
 *    ```js
 *    {
 *      type: 'reference-image',
 *      identifier: 'bravo',
 *      label: 'bravo',
 *      alt: 'alpha',
 *    }
 *    ```
 * @see https://github.com/syntax-tree/mdast#imagereference
 */
export interface ImageReferenceDataNode
  extends InlineDataNode<InlineDataNodeType.REFERENCE_IMAGE>, DataNodeAlternative {
}
