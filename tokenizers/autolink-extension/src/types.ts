import type { NodeInterval } from '@yozora/character'
import type { AutolinkContentType } from '@yozora/tokenizer-autolink'
import type {
  YastToken,
  YastTokenDelimiter,
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
 * An extension autolink token.
 */
export interface AutolinkExtensionToken extends YastToken<AutolinkExtensionType> {
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
export interface AutolinkExtensionTokenDelimiter extends YastTokenDelimiter {
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
