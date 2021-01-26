import type { YastParent, YastResource } from '@yozora/tokenizercore'
import type {
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerPostMatchPhaseState,
  YastInlineNode,
} from '@yozora/tokenizercore-inline'


/**
 * typeof Autolink
 */
export const AutolinkType = 'autolink'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type AutolinkType = typeof AutolinkType


/**
 *
 * @example
 *    ````markdown
 *    ````
 *    ===>
 *    ```js
 *    ```
 * @see https://github.github.com/gfm/#autolink
 */
export interface Autolink extends
  YastResource,
  YastInlineNode<AutolinkType>,
  YastParent<YastInlineNode> {

}


/**
 * State on match phase of AutolinkTokenizer
 */
export type AutolinkMatchPhaseState =
  & InlineTokenizerMatchPhaseState<AutolinkType>
  & AutolinkMatchPhaseStateData


/**
 * State on post-match phase of AutolinkTokenizer
 */
export type AutolinkPostMatchPhaseState =
  & InlineTokenizerPostMatchPhaseState<AutolinkType>
  & AutolinkMatchPhaseStateData


/**
 * State data of match phase of AutolinkTokenizer
 */
export interface AutolinkMatchPhaseStateData {
  /**
   * Start/Left Delimiter of AutolinkToken
   */
  openerDelimiter: AutolinkTokenDelimiter
  /**
   * End/Right Delimiter of AutolinkToken
   */
  closerDelimiter: AutolinkTokenDelimiter
}


/**
 * Delimiter of AutolinkToken
 */
export interface AutolinkTokenDelimiter extends InlineTokenDelimiter {
  type: 'opener' | 'closer'
}
