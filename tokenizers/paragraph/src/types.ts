import type { Paragraph, ParagraphType } from '@yozora/ast'
import type {
  BaseTokenizerProps,
  PhrasingContentLine,
  YastBlockToken,
} from '@yozora/core-tokenizer'

export type T = ParagraphType
export type Node = Paragraph
export const uniqueName = '@yozora/tokenizer-paragraph'

export interface Token extends YastBlockToken<T> {
  /**
   * Lines to construct the contents of a paragraph.
   */
  lines: PhrasingContentLine[]
}

export type TokenizerProps = Omit<BaseTokenizerProps, 'name'>
