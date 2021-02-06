import type { NodeInterval } from '@yozora/character'
import type { YastParent, YastResource } from '@yozora/tokenizercore'
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


// Content type of autolink
export type AutolinkContentType = 'uri' | 'email'


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
   * Autolink content type: absolute uri or email.
   */
  contentType: AutolinkContentType
  /**
   * Auto link content.
   */
  content: NodeInterval
}


/**
 * Delimiter of AutolinkToken
 */
export interface AutolinkTokenDelimiter
  extends InlineTokenDelimiter {
  type: 'full'
  /**
   * Autolink content type: absolute uri or email.
   */
  contentType: AutolinkContentType
  /**
   * Auto link content.
   */
  content: NodeInterval
}
