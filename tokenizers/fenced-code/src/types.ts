import type { Code, CodeType } from '@yozora/ast'
import type { NodePoint } from '@yozora/character'
import type {
  BaseTokenizerProps,
  PartialYastBlockToken,
  PhrasingContentLine,
} from '@yozora/core-tokenizer'

export type T = CodeType
export type Node = Code
export const uniqueName = '@yozora/tokenizer-code'

export interface Token extends PartialYastBlockToken<T> {
  /**
   *
   */
  indent: number
  /**
   *
   */
  marker: number
  /**
   *
   */
  markerCount: number
  /**
   * Lines to construct the contents of a paragraph.
   */
  lines: PhrasingContentLine[]
  /**
   * Meta info string
   */
  infoString: NodePoint[]
}

export type TokenizerProps = Omit<BaseTokenizerProps, 'name'>
