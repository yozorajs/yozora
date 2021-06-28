import type { InlineMath, InlineMathType } from '@yozora/ast'
import type {
  BaseInlineTokenizerProps,
  PartialYastInlineToken,
  YastTokenDelimiter,
} from '@yozora/core-tokenizer'

export type T = InlineMathType
export type Node = InlineMath
export const uniqueName = '@yozora/tokenizer-inline-math'

export interface Token extends PartialYastInlineToken<T> {
  /**
   * Thickness of the InlineMathDelimiter
   */
  thickness: number
}

/**
 * Delimiter of InlineMathToken.
 */
export interface Delimiter extends YastTokenDelimiter {
  type: 'full'
  /**
   * Thickness of the InlineMathDelimiter
   */
  thickness: number
}

export interface TokenizerProps extends Partial<BaseInlineTokenizerProps> {
  /**
   * Whether if the backtick mark wrapping necessary.
   * @default true
   */
  readonly backtickRequired?: boolean
}
