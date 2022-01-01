import type { IInlineMath, InlineMathType } from '@yozora/ast'
import type {
  IBaseInlineTokenizerProps,
  IPartialYastInlineToken,
  IYastTokenDelimiter,
} from '@yozora/core-tokenizer'

export type T = InlineMathType
export type INode = IInlineMath
export const uniqueName = '@yozora/tokenizer-inline-math'

export interface IToken extends IPartialYastInlineToken<T> {
  /**
   * Thickness of the InlineMathDelimiter
   */
  thickness: number
}

/**
 * IDelimiter of InlineMathToken.
 */
export interface IDelimiter extends IYastTokenDelimiter {
  type: 'full'
  /**
   * Thickness of the InlineMathDelimiter
   */
  thickness: number
}

export interface ITokenizerProps extends Partial<IBaseInlineTokenizerProps> {
  /**
   * Whether if the backtick mark wrapping necessary.
   * @default true
   */
  readonly backtickRequired?: boolean
}
