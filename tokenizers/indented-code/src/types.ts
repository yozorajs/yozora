import type { Code, CodeType } from '@yozora/ast'
import type {
  BaseTokenizerProps,
  PartialYastBlockToken,
  PhrasingContentLine,
} from '@yozora/core-tokenizer'

export type T = CodeType
export type Node = Code
export const uniqueName = '@yozora/tokenizer-indented-code'

export interface Token extends PartialYastBlockToken<T> {
  /**
   * Lines to construct the contents of a paragraph.
   */
  lines: PhrasingContentLine[]
}

export type TokenizerProps = Omit<BaseTokenizerProps, 'name'>
