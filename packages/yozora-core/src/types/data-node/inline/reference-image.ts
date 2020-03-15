import { InlineDataNodeType } from '../category'
import { DataNodeAlternative, InlineDataNode } from '../_base'


/**
 * data of ImageReferenceDataNode
 */
export interface ReferenceImageDataNodeData extends DataNodeAlternative {

}


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
export type ReferenceImageDataNode = InlineDataNode<
  InlineDataNodeType.REFERENCE_IMAGE, ReferenceImageDataNodeData>
