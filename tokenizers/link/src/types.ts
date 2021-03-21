import type { Link } from '@yozora/ast'
import type { NodeInterval } from '@yozora/character'
import type { YastToken, YastTokenDelimiter } from '@yozora/core-tokenizer'

export const uniqueName = '@yozora/tokenizer-link'
export type T = typeof uniqueName
export type Node = Link

/**
 * A link token.
 */
export interface Token extends YastToken<T> {
  /**
   * Link destination interval.
   */
  destinationContent?: NodeInterval
  /**
   * Link title interval.
   */
  titleContent?: NodeInterval
}

/**
 * Delimiter of LinkToken.
 */
export interface Delimiter extends YastTokenDelimiter {
  /**
   * Delimiter type.
   */
  type: 'opener' | 'closer'
  /**
   * Link destination interval.
   */
  destinationContent?: NodeInterval
  /**
   * Link title interval.
   */
  titleContent?: NodeInterval
}

/**
 * Params for constructing LinkTokenizer
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
