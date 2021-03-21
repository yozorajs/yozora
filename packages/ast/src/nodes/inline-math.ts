import type { YastLiteral } from '../ast'

export const InlineMathType = 'math'
export type InlineMathType = typeof InlineMathType

/**
 * Inline math content.
 */
export type InlineMath = YastLiteral<InlineMathType>

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
