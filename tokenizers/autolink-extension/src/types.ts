import type { Link, LinkType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import type {
  IBaseInlineTokenizerProps,
  IPartialYastInlineToken,
  IResultOfRequiredEater,
  ITokenizer,
  IYastTokenDelimiter,
} from '@yozora/core-tokenizer'
import type { AutolinkContentType } from '@yozora/tokenizer-autolink'

export type T = LinkType
export type INode = Link
export const uniqueName = '@yozora/tokenizer-autolink-extension'

// Content type of autolink
export type AutolinkExtensionContentType = AutolinkContentType | 'uri-www'

export interface IToken extends IPartialYastInlineToken<T> {
  /**
   * Autolink content type: absolute uri or email.
   */
  contentType: AutolinkExtensionContentType
}

export interface IDelimiter extends IYastTokenDelimiter {
  type: 'full'
  /**
   * Autolink and autolink-extension content types.
   */
  contentType: AutolinkExtensionContentType
}

export type IThis = ITokenizer

export type ITokenizerProps = Partial<IBaseInlineTokenizerProps>

export type ContentEater = (
  nodePoints: ReadonlyArray<INodePoint>,
  startIndex: number,
  endIndex: number,
) => IResultOfRequiredEater

export interface ContentHelper {
  contentType: AutolinkExtensionContentType
  eat: ContentEater
}
