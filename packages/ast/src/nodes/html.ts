import type { YastLiteral } from '../ast'

export const HtmlType = 'html'
export type HtmlType = typeof HtmlType

/**
 * HTML (Literal) represents a fragment of raw HTML.
 * @see https://github.com/syntax-tree/mdast#html
 * @see https://github.github.com/gfm/#html-blocks
 * @see https://github.github.com/gfm/#raw-html
 */
export type Html = YastLiteral<HtmlType>

export enum HtmlContentType {
  CDATA = 'cdata',
  Closing = 'closing',
  Comment = 'comment',
  Declaration = 'declaration',
  Instruction = 'instruction',
  Open = 'open',
}

/**
 * Example:
 *
 *    ````markdown
 *    <div>
 *    ````
 *
 * Yields:
 *
 *    ```json
 *    {
 *      "type": "html",
 *      "value": "<div>"
 *    }
 *    ```
 */
