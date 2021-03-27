import type { Text, TextType } from '@yozora/ast'
import type {
  BaseTokenizerProps,
  YastInlineToken,
  YastTokenDelimiter,
} from '@yozora/core-tokenizer'

export type T = TextType
export type Node = Text
export const uniqueName = '@yozora/tokenizer-text'

export type Token = YastInlineToken<T>

export type Delimiter = YastTokenDelimiter

export interface TokenizerProps extends Omit<BaseTokenizerProps, 'name'> {
  /**
   * Delimiter group identity.
   */
  readonly delimiterGroup?: string
}
