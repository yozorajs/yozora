import type { Link, LinkType } from '@yozora/ast'
import type { NodeInterval, NodePoint } from '@yozora/character'
import type {
  BaseTokenizerProps,
  ResultOfRequiredEater,
  YastInlineToken,
  YastTokenDelimiter,
} from '@yozora/core-tokenizer'
import type { AutolinkContentType } from '@yozora/tokenizer-autolink'

export type T = LinkType
export type Node = Link
export const uniqueName = '@yozora/tokenizer-autolink-extension'

// Content type of autolink
export type AutolinkExtensionContentType = AutolinkContentType | 'uri-www'

export interface Token extends YastInlineToken<T> {
  /**
   * Autolink content type: absolute uri or email.
   */
  contentType: AutolinkExtensionContentType
  /**
   * Auto link content.
   */
  content: NodeInterval
}

export interface Delimiter extends YastTokenDelimiter {
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

export interface TokenizerProps extends Omit<BaseTokenizerProps, 'name'> {
  /**
   * Delimiter group identity.
   */
  readonly delimiterGroup?: string
}

export type ContentEater = (
  nodePoints: ReadonlyArray<NodePoint>,
  startIndex: number,
  endIndex: number,
) => ResultOfRequiredEater

export interface ContentHelper {
  contentType: AutolinkExtensionContentType
  eat: ContentEater
}
