import type { Image } from '@yozora/ast'
import type { NodeInterval } from '@yozora/character'
import type { YastToken, YastTokenDelimiter } from '@yozora/core-tokenizer'

export const uniqueName = '@yozora/tokenizer-image'
export type T = typeof uniqueName
export type Node = Image

/**
 * An image token.
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
 * Delimiter of ImageToken.
 */
export interface Delimiter extends YastTokenDelimiter {
  /**
   * Delimiter type.
   */
  type: 'opener' | 'closer'
  /**
   * link destination
   */
  destinationContent?: NodeInterval
  /**
   * link title
   */
  titleContent?: NodeInterval
}

/**
 * Params for constructing ImageDeleteTokenizer
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
