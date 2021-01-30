import type {
  YastNodeInterval,
  YastParent,
  YastResource,
} from '@yozora/tokenizercore'
import type {
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseState,
  YastInlineNode,
} from '@yozora/tokenizercore-inline'


/**
 * typeof Link
 */
export const LinkType = 'link'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type LinkType = typeof LinkType


/**
 * 超链接
 * Link represents a hyperlink.
 *
 * @example
 *    ````markdown
 *    [alpha](https://example.com "bravo")
 *    ````
 *    ===>
 *    ```json
 *    [
 *      {
 *        "type": "link",
 *        "url": "https://example.com",
 *        "title": "bravo",
 *        "children": [
 *          {
 *            "type": "text",
 *            "value": "alpha"
 *          }
 *        ]
 *      }
 *    ]
 *    ```
 * @see https://github.com/syntax-tree/mdast#link
 * @see https://github.github.com/gfm/#inline-link
 */
export interface Link extends
  YastResource,
  YastInlineNode<LinkType>,
  YastParent<YastInlineNode>{

}


/**
 * State on match phase of LinkTokenizer
 */
export interface LinkMatchPhaseState
  extends InlineTokenizerMatchPhaseState<LinkType> {
  /**
   * Link destination interval.
   */
  destinationContent?: YastNodeInterval
  /**
   * Link title interval.
   */
  titleContent?: YastNodeInterval
}


/**
 * Delimiter of LinkToken
 */
export interface LinkTokenDelimiter extends InlineTokenDelimiter {
  /**
   * Delimiter type.
   */
  type: 'opener' | 'closer'
  /**
   * Link destination interval.
   */
  destinationContent?: YastNodeInterval
  /**
   * Link title interval.
   */
  titleContent?: YastNodeInterval
}
