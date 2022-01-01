import type { IYastAlternative, IYastAssociation, IYastNode, IYastReference } from '../ast'

export const ImageReferenceType = 'imageReference'
export type ImageReferenceType = typeof ImageReferenceType

/**
 * ImageReference represents an image through association, or its original
 * source if there is no association.
 * @see https://github.github.com/gfm/#images
 * @see https://github.com/syntax-tree/mdast#imagereference
 */
export interface IImageReference
  extends IYastNode<ImageReferenceType>,
    IYastAssociation,
    IYastReference,
    IYastAlternative {}

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
