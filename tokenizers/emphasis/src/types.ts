import type { Emphasis, EmphasisType, Strong, StrongType } from '@yozora/ast'
import type {
  IBaseInlineTokenizerProps,
  IPartialYastInlineToken,
  ITokenizer,
  IYastTokenDelimiter,
} from '@yozora/core-tokenizer'

export type T = EmphasisType | StrongType
export type INode = Emphasis | Strong
export const uniqueName = '@yozora/tokenizer-emphasis'

export interface IToken extends IPartialYastInlineToken<T> {
  /**
   * IDelimiter thickness.
   */
  thickness: number
}

export interface IDelimiter extends IYastTokenDelimiter {
  /**
   * Thickness of the delimiter.
   */
  thickness: number
  /**
   * The original thickness of the delimiter.
   */
  originalThickness: number
}

export type IThis = ITokenizer

export type ITokenizerProps = Partial<IBaseInlineTokenizerProps>
