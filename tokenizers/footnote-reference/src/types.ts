import type { FootnoteReferenceType, IFootnoteReference, IYastAssociation } from '@yozora/ast'
import type {
  IBaseInlineTokenizerProps,
  IPartialYastInlineToken,
  ITokenizer,
  IYastTokenDelimiter,
} from '@yozora/core-tokenizer'

export const uniqueName = '@yozora/tokenizer-footnote-reference'

export type T = FootnoteReferenceType
export type INode = IFootnoteReference

export interface IToken extends IPartialYastInlineToken<T>, IYastAssociation {}

export interface IDelimiter extends IYastTokenDelimiter {
  type: 'full'
}

export type IThis = ITokenizer

export type ITokenizerProps = Partial<IBaseInlineTokenizerProps>
