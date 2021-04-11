import type { Heading, HeadingType } from '@yozora/ast'
import type {
  BaseTokenizerProps,
  PartialYastBlockToken,
  PhrasingContentLine,
} from '@yozora/core-tokenizer'

export type T = HeadingType
export type Node = Heading
export const uniqueName = '@yozora/tokenizer-heading'

export interface Token extends PartialYastBlockToken<T> {
  /**
   * Level of heading
   */
  depth: 1 | 2 | 3 | 4 | 5 | 6
  /**
   * Contents
   */
  line: PhrasingContentLine
}

export type TokenizerProps = Partial<BaseTokenizerProps>
