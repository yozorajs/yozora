import type {
  IMatchBlockHook,
  IPhrasingContentLine,
  ITokenizer,
  IYastBlockToken,
} from '@yozora/core-tokenizer'

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

/**
 * Hook on match-block phase.
 */
export type IMatchBlockPhaseHook = IMatchBlockHook & Pick<ITokenizer, 'name' | 'priority'>

/**
 * Node on match-block phase.
 */
export interface IYastMatchBlockState {
  /**
   *
   */
  hook: IMatchBlockPhaseHook
  /**
   *
   */
  token: IYastBlockToken
}

/**
 * A tree consisted with IYastBlockToken type nodes.
 */
export interface IYastBlockTokenTree extends IYastBlockToken<'root'> {
  /**
   * Child nodes.
   */
  children: IYastBlockToken[]
}
