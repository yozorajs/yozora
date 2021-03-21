import type { YastParent, YastResource } from '../ast'

export const LinkType = 'link'
export type LinkType = typeof LinkType

/**
 * Link represents a hyperlink.
 * @see https://github.com/syntax-tree/mdast#link
 * @see https://github.github.com/gfm/#inline-link
 */
export interface Link extends YastParent<LinkType>, YastResource {}

/**
 * Example:
 *
 *    ````markdown
 *    [alpha](https://example.com "bravo")
 *    ````
 *
 * Yields:
 *
 *    ```json
 *    {
 *      "type": "link",
 *      "url": "https://example.com",
 *      "title": "bravo",
 *      "children": [
 *        {
 *          "type": "text",
 *          "value": "alpha"
 *        }
 *      ]
 *    }
 *    ```
 */
