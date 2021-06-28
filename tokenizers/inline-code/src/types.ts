import type { InlineCode, InlineCodeType } from '@yozora/ast'
import type {
  BaseInlineTokenizerProps,
  PartialYastInlineToken,
  YastTokenDelimiter,
} from '@yozora/core-tokenizer'

export type T = InlineCodeType
export type Node = InlineCode
export const uniqueName = '@yozora/tokenizer-inline-code'

export interface Token extends PartialYastInlineToken<T> {
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

export type TokenizerProps = Partial<BaseInlineTokenizerProps>
