import type { IInlineCode, InlineCodeType } from '@yozora/ast'
import type {
  IBaseInlineTokenizerProps,
  IPartialYastInlineToken,
  ITokenizer,
  IYastTokenDelimiter,
} from '@yozora/core-tokenizer'

export type T = InlineCodeType
export type INode = IInlineCode
export const uniqueName = '@yozora/tokenizer-inline-code'

export interface IToken extends IPartialYastInlineToken<T> {
  /**
   * Thickness of the InlineCodeDelimiter.
   */
  thickness: number
}

export interface IDelimiter extends IYastTokenDelimiter {
  type: 'full'
  /**
   * Thickness of the InlineCodeDelimiter.
   */
  thickness: number
}

export type IHookContext = ITokenizer

export type ITokenizerProps = Partial<IBaseInlineTokenizerProps>
