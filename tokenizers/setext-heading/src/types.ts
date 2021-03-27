import type { Heading, HeadingType } from '@yozora/ast'
import type {
  BaseTokenizerProps,
  PhrasingContentLine,
  YastBlockToken,
} from '@yozora/core-tokenizer'

export type T = HeadingType
export type Node = Heading
export const uniqueName = '@yozora/tokenizer-setext-heading'

export interface Token extends YastBlockToken<T> {
  /**
   * CodePoint of '-' / '='
   */
  marker: number
  /**
   * Contents
   */
  lines: ReadonlyArray<PhrasingContentLine>
}

export type TokenizerProps = Omit<BaseTokenizerProps, 'name'>
