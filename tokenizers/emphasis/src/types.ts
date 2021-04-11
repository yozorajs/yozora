import type { Emphasis, EmphasisType, Strong, StrongType } from '@yozora/ast'
import type {
  BaseTokenizerProps,
  PartialYastInlineToken,
  YastTokenDelimiter,
} from '@yozora/core-tokenizer'

export type T = EmphasisType | StrongType
export type Node = Emphasis | Strong
export const uniqueName = '@yozora/tokenizer-emphasis'

export interface Token extends PartialYastInlineToken<T> {
  /**
   * Delimiter thickness.
   */
  thickness: number
}

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

export interface TokenizerProps extends Partial<BaseTokenizerProps> {
  /**
   * Delimiter group identity.
   */
  readonly delimiterGroup?: string
}
