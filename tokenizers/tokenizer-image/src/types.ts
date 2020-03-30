import { DataNode, DataNodeResource, DataNodeAlternative } from '@yozora/tokenizer-core'


/**
 * typeof ImageDataNode
 */
export const ImageDataNodeType = 'IMAGE'
export type ImageDataNodeType = typeof ImageDataNodeType


/**
 * typeof ReferenceImageDataNode
 */
export const ReferenceImageDataNodeType = 'REFERENCE_IMAGE'
export type ReferenceImageDataNodeType = typeof ReferenceImageDataNodeType


/**
 * data of ImageDataNode
 */
export interface ImageDataNodeData extends DataNodeResource, DataNodeAlternative {

}


/**
 * 图片
 * Image represents an image.
 *
 * @example
 *    ````markdown
 *    ![alpha](https://example.com/favicon.ico "bravo")
 *    ````
 *    ===>
 *    ```js
 *    {
 *      type: 'IMAGE',
 *      url: 'https://example.com/favicon.ico',
 *      title: 'bravo',
 *      alt: 'alpha'
 *    }
 *    ```
 * @see https://github.com/syntax-tree/mdast#image
 * @see https://github.github.com/gfm/#images
 */
export type ImageDataNode = DataNode<ImageDataNodeType, ImageDataNodeData>
