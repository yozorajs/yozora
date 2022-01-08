import type { ILink, LinkType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import type {
  IBaseInlineTokenizerProps,
  IPartialYastInlineToken,
  IResultOfRequiredEater,
  ITokenizer,
  IYastTokenDelimiter,
} from '@yozora/core-tokenizer'

// Content type of autolink
export type AutolinkContentType = 'uri' | 'email'

export type T = LinkType
export type INode = ILink
export const uniqueName = '@yozora/tokenizer-autolink'

export interface IToken extends IPartialYastInlineToken<T> {
  /**
   * Autolink content type: absolute uri or email.
   */
  contentType: AutolinkContentType
}

export interface IDelimiter extends IYastTokenDelimiter {
  type: 'full'
  /**
   * Autolink content type: absolute uri or email.
   */
  contentType: AutolinkContentType
}

export type IHookContext = ITokenizer

export type ITokenizerProps = Partial<IBaseInlineTokenizerProps>

export type ContentEater = (
  nodePoints: ReadonlyArray<INodePoint>,
  startIndex: number,
  endIndex: number,
) => IResultOfRequiredEater

export interface IContentHelper {
  contentType: AutolinkContentType
  eat: ContentEater
}
