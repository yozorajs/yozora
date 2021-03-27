import type { InlineMath, InlineMathType } from '@yozora/ast'
import type {
  BaseTokenizerProps,
  YastInlineToken,
  YastTokenDelimiter,
} from '@yozora/core-tokenizer'

export type T = InlineMathType
export type Node = InlineMath
export const uniqueName = '@yozora/tokenizer-inline-math'

export interface Token extends YastInlineToken<T> {
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

export interface TokenizerProps extends Omit<BaseTokenizerProps, 'name'> {
  /**
   * Delimiter group identity.
   */
  readonly delimiterGroup?: string
}
