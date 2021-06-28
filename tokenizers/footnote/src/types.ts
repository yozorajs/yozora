import type { Footnote, FootnoteType } from '@yozora/ast'
import type {
  BaseInlineTokenizerProps,
  PartialYastInlineToken,
  YastTokenDelimiter,
} from '@yozora/core-tokenizer'

export type T = FootnoteType
export type Node = Footnote
export const uniqueName = '@yozora/tokenizer-footnote'

export type Token = PartialYastInlineToken<T>

export interface Delimiter extends YastTokenDelimiter {
  /**
   * Delimiter type.
   */
  type: 'opener' | 'closer'
}

export type TokenizerProps = Partial<BaseInlineTokenizerProps>
