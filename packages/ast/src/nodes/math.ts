import type { IYastLiteral } from '../ast'

export const MathType = 'math'
export type MathType = typeof MathType

/**
 * Math content.
 */
export type IMath = IYastLiteral<MathType>

/**
 * Example:
 *
 *    ````markdown
 *    $$x^2 + y^2 = z^2$$
 *    ````
 *
 * Yields:
 *
 *    ```json
 *    {
 *      "type": "math",
 *      "value": "$$x^2 + y^2 = z^2$$"
 *    }
 *    ```
 */
