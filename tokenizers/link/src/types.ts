import type { YastResource } from '@yozora/tokenizercore'
import type {
  ContentFragment,
  InlinePotentialToken,
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerParsePhaseState,
  YastInlineNode,
} from '@yozora/tokenizercore-inline'


/**
 * typeof Link
 */
export const LinkType = 'LINK'
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
 *        "type": "LINK",
 *        "url": "https://example.com",
 *        "title": "bravo",
 *        "children": [
 *          {
 *            "type": "TEXT",
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
  InlineTokenizerParsePhaseState<LinkType> {
  /**
   *
   */
  children: Exclude<InlineTokenizerParsePhaseState['children'], undefined>
}


/**
 * Delimiter of LinkToken
 */
export interface LinkTokenDelimiter extends InlineTokenDelimiter {
  /**
   * link destination
   */
  destinationContents?: ContentFragment
  /**
   * link title
   */
  titleContents?: ContentFragment
}


/**
 * Potential token of Link
 */
export interface LinkPotentialToken
  extends InlinePotentialToken<LinkType, LinkTokenDelimiter> {
  /**
   * link destination
   */
  destinationContents?: ContentFragment
  /**
   * link title
   */
  titleContents?: ContentFragment
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
  /**
   * Internal raw content fragments
   */
  innerRawContents: Exclude<InlinePotentialToken['innerRawContents'], undefined>
}


/**
 * State of match phase of LinkTokenizer
 */
export interface LinkMatchPhaseState
  extends InlineTokenizerMatchPhaseState<LinkType> {
  /**
   * link destination
   */
  destinationContents?: ContentFragment
  /**
   * link title
   */
  titleContents?: ContentFragment
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
