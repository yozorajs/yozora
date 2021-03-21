import type { InlineCode } from '@yozora/ast'
import type { YastToken, YastTokenDelimiter } from '@yozora/core-tokenizer'

export const uniqueName = '@yozora/tokenizer-inline-code'
export type T = typeof uniqueName
export type Node = InlineCode

/**
 * An inlineCode token.
 */
export interface Token extends YastToken<T> {
  /**
   * Thickness of the InlineCodeDelimiter.
   */
  thickness: number
}

/**
 * Delimiter of InlineCodeToken.
 */
export interface Delimiter extends YastTokenDelimiter {
  type: 'full'
  /**
   * Thickness of the InlineCodeDelimiter.
   */
  thickness: number
}

/**
 * Params for constructing InlineCodeTokenizer
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
