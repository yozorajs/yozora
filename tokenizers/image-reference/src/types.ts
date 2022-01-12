import type { Association, ImageReference, ImageReferenceType, Reference } from '@yozora/ast'
import type {
  IBaseInlineTokenizerProps,
  IPartialYastInlineToken,
  ITokenizer,
  IYastTokenDelimiter,
} from '@yozora/core-tokenizer'
import type { ILinkReferenceDelimiterBracket } from '@yozora/tokenizer-link-reference'

export const uniqueName = '@yozora/tokenizer-image-reference'

export type T = ImageReferenceType
export type INode = ImageReference

export interface IToken extends IPartialYastInlineToken<T>, Association, Reference {}

export interface IDelimiter extends IYastTokenDelimiter {
  brackets: ILinkReferenceDelimiterBracket[]
}

export type IThis = ITokenizer

export type ITokenizerProps = Partial<IBaseInlineTokenizerProps>
