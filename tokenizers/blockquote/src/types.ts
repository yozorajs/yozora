import type { Blockquote, BlockquoteType } from '@yozora/ast'
import type {
  BaseTokenizerProps,
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

export type TokenizerProps = Omit<BaseTokenizerProps, 'name'>
