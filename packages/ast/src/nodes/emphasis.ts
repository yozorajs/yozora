import type { YastParent } from '../ast'

export const EmphasisType = 'emphasis'
export type EmphasisType = typeof EmphasisType

/**
 * Emphasis represents stress emphasis of its contents.
 * @see https://github.com/syntax-tree/mdast#emphasis
 * @see https://github.github.com/gfm/#emphasis-and-strong-emphasis
 */
export type Emphasis = YastParent<EmphasisType>

/**
 * Example:
 *
 *    ````markdown
 *    *alpha* _bravo_
 *    ````
 *
 * Yields:
 *
 *    ```json
 *    [
 *      {
 *        "type": "emphasis",
 *        "children": [
 *          {
 *            "type": "text",
 *            "value": "alpha"
 *          }
 *        ]
 *      },
 *      {
 *        "type": "text",
 *        "value": " "
 *      },
 *      {
 *        "type": "emphasis",
 *        "children": [
 *          {
 *             "type": "text",
 *             "value": "bravo"
 *           }
 *        ]
 *      },
 *    ]
 *    ```
 */
