import type { InlineMath } from '@yozora/ast'
import type { YastToken, YastTokenDelimiter } from '@yozora/core-tokenizer'

export const uniqueName = '@yozora/tokenizer-inline-math'
export type T = typeof uniqueName
export type Node = InlineMath

/**
 * An inlineMath token.
 */
export interface Token extends YastToken<T> {
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

/**
 * Params for constructing InlineMathTokenizer
 */
export interface TokenizerProps {
  /**
   * Delimiter group identity.
   */
  readonly delimiterGroup?: string
  /**
   * Delimiter priority.
   */
  readonly delimiterPriority?: number
}
