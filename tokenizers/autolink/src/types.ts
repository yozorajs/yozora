import type { Link } from '@yozora/ast'
import type { NodeInterval, NodePoint } from '@yozora/character'
import type {
  ResultOfRequiredEater,
  YastToken,
  YastTokenDelimiter,
} from '@yozora/core-tokenizer'

export const uniqueName = '@yozora/tokenizer-autolink'
export type T = typeof uniqueName
export type Node = Link

// Content type of autolink
export type AutolinkContentType = 'uri' | 'email'

/**
 * An autolink token.
 */
export interface Token extends YastToken<T> {
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
 * Delimiter of AutolinkToken.
 */
export interface Delimiter extends YastTokenDelimiter {
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

/**
 * Params for constructing AutolinkTokenizer
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
  contentType: AutolinkContentType
  eat: ContentEater
}
