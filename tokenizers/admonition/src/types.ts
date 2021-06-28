import type { Admonition, AdmonitionType } from '@yozora/ast'
import type {
  BaseBlockTokenizerProps,
  YastBlockToken,
} from '@yozora/core-tokenizer'
import type { FencedBlockToken } from '@yozora/tokenizer-fenced-block'

export type T = AdmonitionType
export type Node = Admonition
export const uniqueName = '@yozora/tokenizer-admonition'

export interface Token extends FencedBlockToken<T> {
  /**
   *
   */
  children?: YastBlockToken[]
}

export type TokenizerProps = Partial<BaseBlockTokenizerProps>
