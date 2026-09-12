import type { Alternative, Association, Node, Reference } from '../ast'

export const ImageReferenceType = 'imageReference'
export type ImageReferenceType = typeof ImageReferenceType

/**
 * ImageReference represents an image through association, or its original
 * source if there is no association.
 * @see https://github.github.com/gfm/#images
 * @see https://github.com/syntax-tree/mdast#imagereference
 */
export interface ImageReference
  extends Node<ImageReferenceType>,
    Association,
    Reference,
    Alternative {}

/**
 * Example:
 *
 *    ````markdown
 *    ![alpha][bravo]
 *
 *    [bravo]: https://www.google.com/favicon.ico
 *    ````
 *
 * Yields:
 *
 *    ```json
 *    {
 *      "type": "imageReference",
 *      "identifier": "bravo",
 *      "label": "bravo",
 *      "referenceType": "full",
 *      "alt": "alpha"
 *    }
 *    ```
 */
