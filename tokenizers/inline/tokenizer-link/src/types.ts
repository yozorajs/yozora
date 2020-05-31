import { DataNodeResource } from '@yozora/tokenizercore'
import {
  InlineContentFragment,
  InlineDataNode,
  InlinePotentialToken,
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerParsePhaseState,
  InlineTokenizerPreMatchPhaseState,
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
}


/**
 * Delimiter of LinkToken
 */
export interface LinkTokenDelimiter
  extends InlineTokenDelimiter<'opener' | 'closer'> {
  /**
   * link destination
   */
  destinationContents?: InlineContentFragment
  /**
   * link title
   */
  titleContents?: InlineContentFragment
}


/**
 * Potential token of Link
 */
export interface LinkPotentialToken
  extends InlinePotentialToken<LinkDataNodeType, LinkTokenDelimiter> {
  /**
   * link destination
   */
  destinationContents?: InlineContentFragment
  /**
   * link title
   */
  titleContents?: InlineContentFragment
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
 * State of pre-match phase of LinkTokenizer
 */
export interface LinkPreMatchPhaseState
  extends InlineTokenizerPreMatchPhaseState<LinkDataNodeType> {
  /**
   * link destination
   */
  destinationContents?: InlineContentFragment
  /**
   * link title
   */
  titleContents?: InlineContentFragment
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


/**
 * State of match phase of LinkTokenizer
 */
export interface LinkMatchPhaseState
  extends InlineTokenizerMatchPhaseState<LinkDataNodeType> {
  /**
   * link destination
   */
  destinationContents?: InlineContentFragment
  /**
   * link title
   */
  titleContents?: InlineContentFragment
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
