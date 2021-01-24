import type {
  YastNodeInterval,
  YastParent,
  YastResource,
} from '@yozora/tokenizercore'
import type {
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerPostMatchPhaseState,
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
  YastResource, YastInlineNode<LinkType>, YastParent<YastInlineNode>{

}


/**
 * State on match phase of LinkTokenizer
 */
export type LinkMatchPhaseState =
  & InlineTokenizerMatchPhaseState<LinkType>
  & LinkMatchPhaseStateData


/**
 * State on post-match phase of LinkTokenizer
 */
export type LinkPostMatchPhaseState =
  & InlineTokenizerPostMatchPhaseState<LinkType>
  & LinkMatchPhaseStateData


/**
 * State of match phase of LinkTokenizer
 */
export interface LinkMatchPhaseStateData {
  /**
   * link destination
   */
  destinationContents?: YastNodeInterval
  /**
   * link title
   */
  titleContents?: YastNodeInterval
  /**
   * Start/Left Delimiter of LinkToken
   */
  openerDelimiter: InlineTokenDelimiter
  /**
   * Middle Delimiter of LinkToken
   */
  middleDelimiter: InlineTokenDelimiter
  /**
   * End/Right Delimiter of LinkToken
   */
  closerDelimiter: InlineTokenDelimiter
}


/**
 * Delimiter of LinkToken
 */
export interface LinkTokenDelimiter extends InlineTokenDelimiter {
  /**
   * link destination
   */
  destinationContents?: YastNodeInterval
  /**
   * link title
   */
  titleContents?: YastNodeInterval
}
