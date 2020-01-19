import { DataNodeResource, DataNodeAlternative } from '../_base'
import { InlineDataNode, InlineDataNodeType } from './_base'


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
export interface ImageDataNode
  extends InlineDataNode<InlineDataNodeType.IMAGE>, DataNodeResource, DataNodeAlternative {
}
