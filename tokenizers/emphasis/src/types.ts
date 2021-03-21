import type { Emphasis, Strong } from '@yozora/ast'
import type { YastToken, YastTokenDelimiter } from '@yozora/core-tokenizer'

export const uniqueName = '@yozora/tokenizer-emphasis'
export type T = typeof uniqueName
export type Node = Emphasis | Strong

/**
 * An emphasis / strong token.
 */
export interface Token extends YastToken<T> {
  /**
   * Delimiter thickness.
   */
  thickness: number
}

/**
 * Delimiter of EmphasisToken.
 */
export interface Delimiter extends YastTokenDelimiter {
  /**
   * Thickness of the delimiter.
   */
  thickness: number
  /**
   * The original thickness of the delimiter.
   */
  originalThickness: number
}

/**
 * Params for constructing TextTokenizer.
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
