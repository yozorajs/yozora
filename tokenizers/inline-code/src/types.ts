import type { InlineCode, InlineCodeType } from '@yozora/ast'
import type {
  IBaseInlineTokenizerProps,
  IPartialInlineToken,
  ITokenDelimiter,
  ITokenizer,
} from '@yozora/core-tokenizer'

export type T = InlineCodeType
export type INode = InlineCode
export const uniqueName = '@yozora/tokenizer-inline-code'

export interface IToken extends IPartialInlineToken<T> {
  /**
   * Thickness of the InlineCodeDelimiter.
   */
  thickness: number
}

export interface IDelimiter extends ITokenDelimiter {
  type: 'full'
  /**
   * Thickness of the InlineCodeDelimiter.
   */
  thickness: number
}

export type IThis = ITokenizer

export type ITokenizerProps = Partial<IBaseInlineTokenizerProps>
