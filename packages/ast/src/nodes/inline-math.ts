import type { Literal } from '../ast'

export const InlineMathType = 'inlineMath'
export type InlineMathType = typeof InlineMathType

/**
 * Inline math content.
 */
export type InlineMath = Literal<InlineMathType>

/**
 * Example:
 *
 *    ````markdown
 *    `$x^2 + y^2 = z^2$`
 *    ````
 *
 * Yields:
 *
 *    ```json
 *    {
 *      "type": "inlineMath",
 *      "value": "$x^2 + y^2 = z^2$"
 *    }
 *    ```
 */
