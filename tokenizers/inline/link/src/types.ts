import type { DataNodeResource } from '@yozora/tokenizercore'
import type {
  ContentFragment,
  InlineDataNode,
  InlinePotentialToken,
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerParsePhaseState,
} from '@yozora/tokenizercore-inline'


/**
 * typeof LinkDataNode
 */
export const LinkDataNodeType = 'LINK'
export type LinkDataNodeType = typeof LinkDataNodeType


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
export interface LinkDataNode extends
  DataNodeResource,
  InlineDataNode<LinkDataNodeType>,
  InlineTokenizerParsePhaseState<LinkDataNodeType> {
  /**
   *
   */
  children: Exclude<InlineTokenizerParsePhaseState['children'], undefined>
}


/**
 * Delimiter of LinkToken
 */
export interface LinkTokenDelimiter
  extends InlineTokenDelimiter<'opener' | 'closer'> {
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
  extends InlinePotentialToken<LinkDataNodeType, LinkTokenDelimiter> {
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
  openerDelimiter: InlineTokenDelimiter<'opener'>
  /**
   * Middle Delimiter of LinkToken
   */
  middleDelimiter: InlineTokenDelimiter<'middle'>
  /**
   * End/Right Delimiter of LinkToken
   */
  closerDelimiter: InlineTokenDelimiter<'closer'>
  /**
   * Internal raw content fragments
   */
  innerRawContents: Exclude<InlinePotentialToken['innerRawContents'], undefined>
}


/**
 * State of match phase of LinkTokenizer
 */
export interface LinkMatchPhaseState
  extends InlineTokenizerMatchPhaseState<LinkDataNodeType> {
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
  openerDelimiter: InlineTokenDelimiter<'opener'>
  /**
   * Middle Delimiter of LinkToken
   */
  middleDelimiter: InlineTokenDelimiter<'middle'>
  /**
   * End/Right Delimiter of LinkToken
   */
  closerDelimiter: InlineTokenDelimiter<'closer'>
}
