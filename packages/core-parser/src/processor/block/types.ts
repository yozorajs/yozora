import type { IPhrasingContentLine } from '@yozora/core-tokenizer'
import type { IYastBlockTokenTree, IYastMatchBlockState, IYastMatchPhaseHook } from '../../types'

/**
 * Raw contents processor for generate YastBlockStateTree.
 */
export interface IBlockContentProcessor {
  /**
   * Consume a phrasing content line.
   * @param line
   */
  consume(line: Readonly<IPhrasingContentLine>): void

  /**
   * All the content has been processed and perform the final collation operation.
   */
  done(): IYastBlockTokenTree

  /**
   * Get current IYastMatchBlockState stack.
   */
  shallowSnapshot(): IYastMatchBlockState[]
}
