import type { YastNode, YastParent } from '../ast'

export const HeadingType = 'heading'
export type HeadingType = typeof HeadingType

/**
 * Heading represents a heading of a section.
 * @see https://github.com/syntax-tree/mdast#heading
 * @see https://github.github.com/gfm/#atx-heading
 */
export interface Heading extends YastParent<HeadingType> {
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
 * Document toc (table of contents).
 */
export interface HeadingToc {
  /**
   * Toc nodes.
   */
  children: HeadingTocNode[]
}

/**
 * Toc node.
 */
export interface HeadingTocNode {
  /**
   * Identifier of the toc node (referer to the Heading.identifier)
   */
  identifier: string
  /**
   * Level of heading
   */
  depth: 1 | 2 | 3 | 4 | 5 | 6
  /**
   * Toc node contents.
   */
  contents: YastNode[]
  /**
   * Sub toc nodes.
   */
  children: HeadingTocNode[]
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
