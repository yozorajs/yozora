import type { IYastNode } from '../ast'

export const ThematicBreakType = 'thematicBreak'
export type ThematicBreakType = typeof ThematicBreakType

/**
 * ThematicBreak represents a thematic break, such as a scene change in
 * a story, a transition to another topic, or a new document.
 * @see https://github.com/syntax-tree/mdast#thematicbreak
 * @see https://github.github.com/gfm/#thematic-break
 */
export type IThematicBreak = IYastNode<ThematicBreakType>

/**
 * Example:
 *
 *    ````markdown
 *    ***
 *    ---
 *    ___
 *    ````
 *
 * Yields:
 *
 *    ```json
 *    [
 *      {
 *        "type": "thematicBreak"
 *      },
 *      {
 *        "type": "thematicBreak"
 *      },
 *      {
 *        "type": "thematicBreak"
 *      }
 *    ]
 *    ```
 */
