import type { Link, LinkType } from '@yozora/ast'
import type { NodePoint } from '@yozora/character'
import type {
  BaseTokenizerProps,
  PartialYastInlineToken,
  ResultOfRequiredEater,
  YastTokenDelimiter,
} from '@yozora/core-tokenizer'

// Content type of autolink
export type AutolinkContentType = 'uri' | 'email'

export type T = LinkType
export type Node = Link
export const uniqueName = '@yozora/tokenizer-autolink'

export interface Token extends PartialYastInlineToken<T> {
  /**
   * Autolink content type: absolute uri or email.
   */
  contentType: AutolinkContentType
}

export interface Delimiter extends YastTokenDelimiter {
  type: 'full'
  /**
   * Autolink content type: absolute uri or email.
   */
  contentType: AutolinkContentType
}

export type TokenizerProps = Partial<BaseTokenizerProps>

export type ContentEater = (
  nodePoints: ReadonlyArray<NodePoint>,
  startIndex: number,
  endIndex: number,
) => ResultOfRequiredEater

export interface ContentHelper {
  contentType: AutolinkContentType
  eat: ContentEater
}
