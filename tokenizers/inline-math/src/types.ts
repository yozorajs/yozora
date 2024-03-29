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
  type: 'full'
  /**
   * Thickness of the InlineMathDelimiter
   */
  thickness: number
}

export interface IThis extends ITokenizer {
  /**
   * Whether if the backtick mark wrapping necessary.
   */
  readonly backtickRequired: boolean
}

export interface ITokenizerProps extends Partial<IBaseInlineTokenizerProps> {
  /**
   * Whether if the backtick mark wrapping necessary.
   * @default true
   */
  readonly backtickRequired?: boolean
}
