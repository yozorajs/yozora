import type { Paragraph, ParagraphType } from '@yozora/ast'
import type {
  BaseBlockTokenizerProps,
  PartialYastBlockToken,
  PhrasingContentLine,
} from '@yozora/core-tokenizer'

export type T = ParagraphType
export type Node = Paragraph
export const uniqueName = '@yozora/tokenizer-paragraph'

export interface Token extends PartialYastBlockToken<T> {
  /**
   * Lines to construct the contents of a paragraph.
   */
  lines: PhrasingContentLine[]
}

export type TokenizerProps = Partial<BaseBlockTokenizerProps>
