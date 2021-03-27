import type { Link, LinkType } from '@yozora/ast'
import type { NodeInterval } from '@yozora/character'
import type {
  BaseTokenizerProps,
  YastInlineToken,
  YastTokenDelimiter,
} from '@yozora/core-tokenizer'

export type T = LinkType
export type Node = Link
export const uniqueName = '@yozora/tokenizer-link'

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
   * Link destination interval.
   */
  destinationContent?: NodeInterval
  /**
   * Link title interval.
   */
  titleContent?: NodeInterval
}

export interface TokenizerProps extends Omit<BaseTokenizerProps, 'name'> {
  /**
   * Delimiter group identity.
   */
  readonly delimiterGroup?: string
}
