import type { NodeInterval } from '@yozora/character'
import type { AutolinkContentType } from '@yozora/tokenizer-autolink'
import type {
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseState,
} from '@yozora/tokenizercore-inline'


/**
 * typeof Autolink
 */
export const AutolinkExtensionType = 'autolink-extension'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type AutolinkExtensionType = typeof AutolinkExtensionType


// Content type of autolink
export type AutolinkExtensionContentType = AutolinkContentType | 'uri-www'



/**
 * State on match phase of AutolinkExtensionTokenizer
 */
export interface AutolinkExtensionMatchPhaseState
  extends InlineTokenizerMatchPhaseState<AutolinkExtensionType> {
  /**
   * Autolink content type: absolute uri or email.
   */
  contentType: AutolinkExtensionContentType
  /**
   * Auto link content.
   */
  content: NodeInterval
}


/**
 * Delimiter of AutolinkExtensionToken
 */
export interface AutolinkExtensionTokenDelimiter
  extends InlineTokenDelimiter {
  type: 'full'
  /**
   * Autolink and autolink-extension content types.
   */
  contentType: AutolinkExtensionContentType
  /**
   * Auto link content.
   */
  content: NodeInterval
}
