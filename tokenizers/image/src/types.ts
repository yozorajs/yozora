import type { Image, ImageType } from '@yozora/ast'
import type { NodeInterval } from '@yozora/character'
import type {
  BaseTokenizerProps,
  YastInlineToken,
  YastTokenDelimiter,
} from '@yozora/core-tokenizer'

export type T = ImageType
export type Node = Image
export const uniqueName = '@yozora/tokenizer-image'

/**
 * An image token.
 */
export interface Token extends YastInlineToken<T> {
  /**
   * Link destination interval.
   */
  destinationContent?: NodeInterval
  /**
   * Link title interval.
   */
  titleContent?: NodeInterval
}

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

export interface TokenizerProps extends Omit<BaseTokenizerProps, 'name'> {
  /**
   * Delimiter group identity.
   */
  readonly delimiterGroup?: string
}
