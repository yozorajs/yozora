import type {
  PhrasingContentLine,
  YastBlockState,
  YastLiteral,
} from '@yozora/core-tokenizer'

/**
 * typeof HtmlBlock
 */
export const HtmlBlockType = 'htmlBlock'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type HtmlBlockType = typeof HtmlBlockType

export type HtmlBlockConditionType = 1 | 2 | 3 | 4 | 5 | 6 | 7

/**
 *
 * @example
 *    ````markdown
 *    ````
 *    ===>
 *    ```js
 *    ```
 *
 * @see https://github.com/syntax-tree/mdast#html
 * @see https://github.github.com/gfm/#html-blocks
 */
export interface HtmlBlock extends YastLiteral<HtmlBlockType> {
  /**
   * @see https://github.github.com/gfm/#start-condition
   */
  htmlType: 'comment' | 'instruction' | 'declaration' | 'cdata' | 'raw'
}

/**
 * Middle state during the whole match and parse phase.
 */
export interface HtmlBlockState extends YastBlockState<HtmlBlockType> {
  /**
   * Number of conditions defined in GFM:
   *
   * 1. Start condition: line begins with the string `<script`, `<pre`, or
   *    `<style` (case-insensitive), followed by whitespace, the string `>`,
   *    or the end of the line.
   *
   *    End condition: line contains an end tag `</script>`, `</pre>`,
   *    or `</style>` (case-insensitive; it need not match the start tag).
   *
   * 2. Start condition: line begins with the string `<!--`.
   *    End condition: line contains the string `-->`.
   *
   * 3. Start condition: line begins with the string `<?`.
   *    End condition: line contains the string `?>`.
   *
   * 4. Start condition: line begins with the string `<!` followed by an
   *    uppercase ASCII letter.
   *
   *    End condition: line contains the character >.
   *
   * 5. Start condition: line begins with the string `<![CDATA[`.
   *    End condition: line contains the string `]]>`.
   *
   * 6. Start condition: line begins the string `<` or `</` followed by one of
   *    the strings (case-insensitive) `address`, `article`, `aside`, `base`,
   *    `basefont`, `blockquote`, `body`, `caption`, `center`, `col`, `colgroup`,
   *    `dd`, `details`, `dialog`, `dir`, `div`, `dl`, `dt`, `fieldset`,
   *    `figcaption`, `figure`, `footer`, `form`, `frame`, `frameset`, `h1`,
   *    `h2`, `h3`, `h4`, `h5`, `h6`, `head`, `header`, `hr`, `html`, `iframe`,
   *    `legend`, `li`, `link`, `main`, `menu`, `menuitem`, `nav`, `noframes`,
   *    `ol`, `optgroup`, `option`, `p`, `param`, `section`, `source`, `summary`,
   *    `table`, `tbody`, `td`, `tfoot`, `th`, `thead`, `title`, `tr`, `track`,
   *    `ul`, followed by whitespace, the end of the line, the string `>`,
   *    or the string `/>`.
   *
   *    End condition: line is followed by a blank line.
   *
   * 7. Start condition: line begins with a complete open tag (with any tag name
   *    other than `script`, `style`, or `pre`) or a complete closing tag,
   *    followed only by whitespace or the end of the line.
   *
   *    End condition: line is followed by a blank line.
   *
   * @see https://github.github.com/gfm/#start-condition
   */
  condition: HtmlBlockConditionType
  /**
   * Contents
   */
  lines: PhrasingContentLine[]
}
