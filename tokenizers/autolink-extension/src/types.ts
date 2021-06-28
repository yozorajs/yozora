import type { Link, LinkType } from '@yozora/ast'
import type { NodePoint } from '@yozora/character'
import type {
  BaseInlineTokenizerProps,
  PartialYastInlineToken,
  ResultOfRequiredEater,
  YastTokenDelimiter,
} from '@yozora/core-tokenizer'
import type { AutolinkContentType } from '@yozora/tokenizer-autolink'

export type T = LinkType
export type Node = Link
export const uniqueName = '@yozora/tokenizer-autolink-extension'

// Content type of autolink
export type AutolinkExtensionContentType = AutolinkContentType | 'uri-www'

export interface Token extends PartialYastInlineToken<T> {
  /**
   * Autolink content type: absolute uri or email.
   */
  contentType: AutolinkExtensionContentType
}

export interface Delimiter extends YastTokenDelimiter {
  type: 'full'
  /**
   * Autolink and autolink-extension content types.
   */
  contentType: AutolinkExtensionContentType
}

export type TokenizerProps = Partial<BaseInlineTokenizerProps>

export type ContentEater = (
  nodePoints: ReadonlyArray<NodePoint>,
  startIndex: number,
  endIndex: number,
) => ResultOfRequiredEater

export interface ContentHelper {
  contentType: AutolinkExtensionContentType
  eat: ContentEater
}
