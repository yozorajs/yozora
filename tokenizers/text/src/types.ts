import type { Text, TextType } from '@yozora/ast'
import type {
  BaseInlineTokenizerProps,
  PartialYastInlineToken,
  YastTokenDelimiter,
} from '@yozora/core-tokenizer'

export type T = TextType
export type Node = Text
export const uniqueName = '@yozora/tokenizer-text'

export type Token = PartialYastInlineToken<T>

export interface Delimiter extends YastTokenDelimiter {
  type: 'full'
}

export type TokenizerProps = Partial<BaseInlineTokenizerProps>
