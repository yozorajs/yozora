import { InlineDataNodeType } from '../category'
import { DataNodeResource, DataNodeAlternative, InlineDataNode } from '../_base'


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
 *      type: 'image',
 *      url: 'https://example.com/favicon.ico',
 *      title: 'bravo',
 *      alt: 'alpha'
 *    }
 *    ```
 * @see https://github.com/syntax-tree/mdast#image
 * @see https://github.github.com/gfm/#images
 */
export type ImageDataNode = InlineDataNode<
  InlineDataNodeType.IMAGE, ImageDataNodeData>
