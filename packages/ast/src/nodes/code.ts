import type { Literal } from '../ast'

export const CodeType = 'code'
export type CodeType = typeof CodeType

/**
 * Code represents a block of preformatted text, such as ASCII art or computer code.
 * @see https://github.com/syntax-tree/mdast#code
 * @see https://github.github.com/gfm/#code-fence
 */
export interface Code extends Literal<CodeType> {
  /**
   * Language of the codes
   */
  lang: string | null
  /**
   * Meta info string
   */
  meta: string | null
}

/**
 * Example:
 *
 *    ````markdown
 *    ```js highlight-line="2"
 *    foo()
 *    bar()
 *    baz()
 *    ```
 *    ````
 *
 * Yields:
 *
 *    ```json
 *    {
 *      "type": "fencedCode",
 *      "lang": "javascript",
 *      "meta": "highlight-line=\"2\"",
 *      "value": "foo()\nbar()\nbaz()"
 *    }
 *    ```
 */
