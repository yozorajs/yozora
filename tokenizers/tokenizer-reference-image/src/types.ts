import { DataNodeAlternative, InlineDataNode } from '@yozora/tokenizer-core'
import { ReferenceImageDataNodeType } from '@yozora/tokenizer-image'
export {
  ImageDataNodeType,
  ReferenceImageDataNodeType,
} from '@yozora/tokenizer-image'


/**
 * data of ReferenceImageDataNode
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
 *      type: 'REFERENCE_IMAGE',
 *      identifier: 'bravo',
 *      label: 'bravo',
 *      alt: 'alpha',
 *    }
 *    ```
 * @see https://github.com/syntax-tree/mdast#imagereference
 */
export type ReferenceImageDataNode = InlineDataNode<ReferenceImageDataNodeType, ReferenceImageDataNodeData>
