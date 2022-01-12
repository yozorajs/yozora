import type { IYastNode } from '../ast'

export const BreakType = 'break'
export type BreakType = typeof BreakType

/**
 * Break represents a line break, such as in poems or addresses.
 * @see https://github.com/syntax-tree/mdast#break
 * @see https://github.github.com/gfm/#hard-line-breaks
 * @see https://github.github.com/gfm/#soft-line-breaks
 */
export type Break = IYastNode<BreakType>

/**
 * Example:
 *
 *    ````markdown
 *    foo··
 *    bar
 *    ````
 *
 * Yields:
 *
 *    ```json
 *    [
 *      {
 *        "type": "text",
 *        "value": "foo"
 *      },
 *      {
 *        "type": "break"
 *      },
 *      {
 *        "type": "text",
 *        "value": "bar"
 *      }
 *    ]
 *    ```
 */
