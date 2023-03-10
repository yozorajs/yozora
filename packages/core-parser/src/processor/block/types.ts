import type {
  IBlockToken,
  IMatchBlockHook,
  IPhrasingContentLine,
  ITokenizer,
} from '@yozora/core-tokenizer'

/**
 * Raw contents processor for generate BlockStateTree.
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
  done(): IBlockTokenTree

  /**
   * Get current IMatchBlockState stack.
   */
  shallowSnapshot(): IMatchBlockState[]
}

/**
 * Hook on match-block phase.
 */
export type IMatchBlockPhaseHook = IMatchBlockHook & Pick<ITokenizer, 'name' | 'priority'>

/**
 * Node on match-block phase.
 */
export interface IMatchBlockState {
  /**
   *
   */
  hook: IMatchBlockPhaseHook
  /**
   *
   */
  token: IBlockToken
}

/**
 * A tree consisted with IBlockToken type nodes.
 */
export interface IBlockTokenTree extends IBlockToken<'root'> {
  /**
   * Child nodes.
   */
  children: IBlockToken[]
}
