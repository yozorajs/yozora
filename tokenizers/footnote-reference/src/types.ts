import type { Association, FootnoteReference, FootnoteReferenceType } from '@yozora/ast'
import type {
  IBaseInlineTokenizerProps,
  IPartialInlineToken,
  ITokenDelimiter,
  ITokenizer,
} from '@yozora/core-tokenizer'

export const uniqueName = '@yozora/tokenizer-footnote-reference'

export type T = FootnoteReferenceType
export type INode = FootnoteReference

export interface IToken extends IPartialInlineToken<T>, Association {}

export interface IDelimiter extends ITokenDelimiter {
  type: 'full'
}

export type IThis = ITokenizer

export type ITokenizerProps = Partial<IBaseInlineTokenizerProps>
