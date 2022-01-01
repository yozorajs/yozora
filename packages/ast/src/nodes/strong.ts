import type { IYastParent } from '../ast'

export const StrongType = 'strong'
export type StrongType = typeof StrongType

/**
 * Strong represents strong importance, seriousness, or urgency for its
 * contents.
 * @see https://github.com/syntax-tree/mdast#strong
 * @see https://github.github.com/gfm/#emphasis-and-strong-emphasis
 */
export type IStrong = IYastParent<StrongType>

/**
 * Example:
 *
 *    ````markdown
 *    **alpha** __bravo__
 *    ````
 *
 * Yields:
 *
 *    ```json
 *    [
 *      {
 *        "type": "strong",
 *        "children": [
 *          {
 *             "type": "text",
 *             "value": "alpha"
 *           }
 *        ]
 *      },
 *      {
 *         "type": "text",
 *         "value": " "
 *      },
 *      {
 *        "type": "strong",
 *        "children": [
 *          {
 *            "type": "text",
 *            "value": "bravo"
 *          }
 *        ]
 *      }
 *    ]
 *    ```
 */
