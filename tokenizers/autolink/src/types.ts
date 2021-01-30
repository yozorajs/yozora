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
  YastParent<YastInlineNode> { }


/**
 * State on match phase of AutolinkTokenizer
 */
export interface AutolinkMatchPhaseState
  extends InlineTokenizerMatchPhaseState<AutolinkType> {
  /**
   * Auto link content.
   */
  content: YastNodeInterval
}


/**
 * Delimiter of AutolinkToken
 */
export interface AutolinkTokenDelimiter
  extends InlineTokenDelimiter {
  type: 'full'
  /**
   * Auto link content.
   */
  content: YastNodeInterval
}
