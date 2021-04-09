import type { Admonition, AdmonitionType } from '@yozora/ast'
import type { BaseTokenizerProps } from '@yozora/core-tokenizer'
import type { FencedBlockToken } from '@yozora/tokenizer-fenced-block'

export type T = AdmonitionType
export type Node = Admonition
export const uniqueName = '@yozora/tokenizer-admonition'

export type Token = FencedBlockToken<T>

export type TokenizerProps = Omit<BaseTokenizerProps, 'name'>
