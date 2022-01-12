import type { Parent } from '../ast'

export const HeadingType = 'heading'
export type HeadingType = typeof HeadingType

/**
 * Heading represents a heading of a section.
 * @see https://github.com/syntax-tree/mdast#heading
 * @see https://github.github.com/gfm/#atx-heading
 */
export interface Heading extends Parent<HeadingType> {
  /**
   * HTML anchor identifier.
   */
  identifier?: string
  /**
   * level of heading
   */
  depth: 1 | 2 | 3 | 4 | 5 | 6
}

/**
 * Example:
 *
 *    ````markdown
 *    # Alpha
 *    ````
 *
 * Yields:
 *
 *    ```json
 *    {
 *      "type": "heading",
 *      "depth": 1,
 *      "children": [
 *        {
 *          "type": "text",
 *          "value": "Alpha"
 *        }
 *      ]
 *    }
 *    ```
 */
