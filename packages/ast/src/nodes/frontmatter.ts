import type { YastLiteral } from '../ast'

export const FrontmatterType = 'frontmatter'
export type FrontmatterType = typeof FrontmatterType

/**
 * Frontmatter content represent out-of-band information about the document.
 * @see https://github.com/syntax-tree/mdast#frontmattercontent
 * @see https://github.com/syntax-tree/mdast#yaml
 * @see https://github.github.com/gfm/#code-fence
 */
export interface Frontmatter extends YastLiteral<FrontmatterType> {
  /**
   * Language of the frontmatter
   * @default 'yaml'
   */
  lang: string
  /**
   * Meta info string
   */
  meta?: string
}

/**
 * Example:
 *
 *    ```markdown
 *    ---
 *    foo: bar
 *    ---
 *    ```
 *
 * Yields:
 *
 *    ```json
 *    {
 *      "type": "frontmatter",
 *      "value": "foo: bar",
 *      "lang": "yaml"
 *    }
 *    ```
 */
