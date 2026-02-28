import type { Link, LinkType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import type {
  IBaseInlineTokenizerProps,
  IPartialInlineToken,
  IResultOfRequiredEater,
  ITokenDelimiter,
  ITokenizer,
} from '@yozora/core-tokenizer'

// Content type of autolink
export type AutolinkContentType = 'uri' | 'email'

export type T = LinkType
export type INode = Link
export const uniqueName = '@yozora/tokenizer-autolink'

export interface IToken extends IPartialInlineToken<T> {
  /**
   * Autolink content type: absolute uri or email.
   */
  contentType: AutolinkContentType
}

export interface IDelimiter extends ITokenDelimiter {
  type: 'full'
  /**
   * Autolink content type: absolute uri or email.
   */
  contentType: AutolinkContentType
}

export type IThis = ITokenizer

export type ITokenizerProps = Partial<IBaseInlineTokenizerProps>

export type ContentEater = (
  nodePoints: readonly INodePoint[],
  startIndex: number,
  endIndex: number,
) => IResultOfRequiredEater

export interface IContentHelper {
  contentType: AutolinkContentType
  eat: ContentEater
}
