import type { YastAlternative, YastNode, YastResource } from '../ast'

export const ImageType = 'image'
export type ImageType = typeof ImageType

/**
 * Image represents an image.
 * @see https://github.com/syntax-tree/mdast#image
 * @see https://github.github.com/gfm/#images
 */
export interface Image
  extends YastNode<ImageType>,
    YastResource,
    YastAlternative {}

/**
 * Example:
 *
 *    ````markdown
 *    ![alpha](https://example.com/favicon.ico "bravo")
 *    ````
 *
 * Yields:
 *
 *    ```json
 *    {
 *      "type": "image",
 *      "url": "https://example.com/favicon.ico",
 *      "title": "bravo",
 *      "alt": "alpha"
 *    }
 *    ```
 */
