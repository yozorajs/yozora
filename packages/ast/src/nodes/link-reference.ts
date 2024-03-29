import type { Association, Parent, Reference } from '../ast'

export const LinkReferenceType = 'linkReference'
export type LinkReferenceType = typeof LinkReferenceType

/**
 * LinkReference represents a hyperlink through association, or its original
 * source if there is no association.
 * @see https://github.com/syntax-tree/mdast#linkreference
 * @see https://github.github.com/gfm/#reference-link
 */
export interface LinkReference extends Parent<LinkReferenceType>, Association, Reference {}

/**
 * Example:
 *
 *    ````markdown
 *    [alpha][Bravo]
 *
 *    [bravo]: #alpha
 *    ````
 *
 * Yields:
 *
 *    ```json
 *    {
 *      "type": "linkReference",
 *      "identifier": "bravo",
 *      "label": "Bravo",
 *      "referenceType": "full",
 *      "children": [
 *        {
 *          "type": "text",
 *          "value": "alpha"
 *        }
 *      ]
 *    }
 *    ```
 */
