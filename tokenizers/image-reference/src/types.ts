import type {
  IImageReference,
  IYastAssociation,
  IYastReference,
  ImageReferenceType,
} from '@yozora/ast'
import type {
  IBaseInlineTokenizerProps,
  IPartialYastInlineToken,
  ITokenizer,
  IYastTokenDelimiter,
} from '@yozora/core-tokenizer'
import type { ILinkReferenceDelimiterBracket } from '@yozora/tokenizer-link-reference'

export const uniqueName = '@yozora/tokenizer-image-reference'

export type T = ImageReferenceType
export type INode = IImageReference

export interface IToken extends IPartialYastInlineToken<T>, IYastAssociation, IYastReference {}

export interface IDelimiter extends IYastTokenDelimiter {
  brackets: ILinkReferenceDelimiterBracket[]
}

export type IThis = ITokenizer

export type ITokenizerProps = Partial<IBaseInlineTokenizerProps>
