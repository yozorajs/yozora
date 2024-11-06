import type { InlineMath, InlineMathType } from '@yozora/ast'
import type {
  IBaseInlineTokenizerProps,
  IPartialInlineToken,
  ITokenDelimiter,
  ITokenizer,
} from '@yozora/core-tokenizer'

export type T = InlineMathType
export type INode = InlineMath
export const uniqueName = '@yozora/tokenizer-inline-math'
export const uniqueName_withBacktick = '@yozora/tokenizer-inline-math_with_backtick'

export interface IToken extends IPartialInlineToken<T> {
  /**
   * Thickness of the InlineMathDelimiter
   */
  thickness: number
}

/**
 * IDelimiter of InlineMathToken.
 */
export interface IDelimiter extends ITokenDelimiter {
  /**
   * Thickness of the InlineMathDelimiter
   */
  thickness: number
}

export interface IThis extends ITokenizer {}

export interface ITokenizerProps extends Partial<IBaseInlineTokenizerProps> {
  /**
   * Whether if the backtick mark wrapping necessary.
   * @default true
   */
  readonly backtickRequired?: boolean
}
