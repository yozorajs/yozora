import type { ThematicBreak, ThematicBreakType } from '@yozora/ast'
import type { BaseTokenizerProps, YastBlockToken } from '@yozora/core-tokenizer'

export type T = ThematicBreakType
export type Node = ThematicBreak
export const uniqueName = '@yozora/tokenizer-thematic-break'

export interface Token extends YastBlockToken<T> {
  /**
   * CodePoint of '-' / '_' / '*'
   */
  marker: number
  /**
   * Whether there are no internal spaces between marker characters
   */
  continuous: boolean
}

export type TokenizerProps = Omit<BaseTokenizerProps, 'name'>
