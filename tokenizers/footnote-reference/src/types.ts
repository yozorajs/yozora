import type { Association, FootnoteReference, FootnoteReferenceType } from '@yozora/ast'
import type {
  IBaseInlineTokenizerProps,
  IPartialYastInlineToken,
  ITokenizer,
  IYastTokenDelimiter,
} from '@yozora/core-tokenizer'

export const uniqueName = '@yozora/tokenizer-footnote-reference'

export type T = FootnoteReferenceType
export type INode = FootnoteReference

export interface IToken extends IPartialYastInlineToken<T>, Association {}

export interface IDelimiter extends IYastTokenDelimiter {
  type: 'full'
}

export type IThis = ITokenizer

export type ITokenizerProps = Partial<IBaseInlineTokenizerProps>
