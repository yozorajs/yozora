import type { Blockquote, BlockquoteType } from '@yozora/ast'
import type {
  BaseBlockTokenizerProps,
  PartialYastBlockToken,
  YastBlockToken,
} from '@yozora/core-tokenizer'

export type T = BlockquoteType
export type Node = Blockquote
export const uniqueName = '@yozora/tokenizer-blockquote'

export interface Token extends PartialYastBlockToken<T> {
  /**
   *
   */
  children: YastBlockToken[]
}

export type TokenizerProps = Partial<BaseBlockTokenizerProps>
