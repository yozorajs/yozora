import type { Link } from '@yozora/ast'
import type { NodeInterval, NodePoint } from '@yozora/character'
import type {
  ResultOfRequiredEater,
  YastToken,
  YastTokenDelimiter,
} from '@yozora/core-tokenizer'
import type { AutolinkContentType } from '@yozora/tokenizer-autolink'

export const uniqueName = '@yozora/tokenizer-autolink-extension'
export type T = typeof uniqueName
export type Node = Link

// Content type of autolink
export type AutolinkExtensionContentType = AutolinkContentType | 'uri-www'

/**
 * An extension autolink token.
 */
export interface Token extends YastToken<T> {
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

/**
 * Params for constructing AutolinkExtensionTokenizer
 */
export interface TokenizerProps {
  /**
   * Delimiter group identity.
   */
  readonly delimiterGroup?: string
  /**
   * Delimiter priority.
   */
  readonly delimiterPriority?: number
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
