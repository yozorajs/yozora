import type { InlineCode, InlineCodeType } from '@yozora/ast'
import type {
  BaseTokenizerProps,
  YastInlineToken,
  YastTokenDelimiter,
} from '@yozora/core-tokenizer'

export type T = InlineCodeType
export type Node = InlineCode
export const uniqueName = '@yozora/tokenizer-inline-code'

export interface Token extends YastInlineToken<T> {
  /**
   * Thickness of the InlineCodeDelimiter.
   */
  thickness: number
}

export interface Delimiter extends YastTokenDelimiter {
  type: 'full'
  /**
   * Thickness of the InlineCodeDelimiter.
   */
  thickness: number
}

export interface TokenizerProps extends Omit<BaseTokenizerProps, 'name'> {
  /**
   * Delimiter group identity.
   */
  readonly delimiterGroup?: string
}
