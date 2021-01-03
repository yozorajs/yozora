import type { YastBlockNodeMeta, YastBlockNodeType } from '../node'
import type { BlockTokenizerMatchPhaseState } from './match'


/**
 * State on parse phase
 */
export interface BlockTokenizerParsePhaseState<
  T extends YastBlockNodeType = YastBlockNodeType,
  > {
  /**
   * Type of DataNode
   */
  type: T
  /**
   * Classify YastNode
   *
   *  - *flow*: Represents this YastNode is in the Document-Flow
   *  - *meta*: Represents this YastNode is a meta data node
   */
  classification: 'flow' | 'meta'
  /**
   * List of child nodes of current data node
   */
  children?: BlockTokenizerParsePhaseState[]
}


/**
 * State-tree on parse phase
 */
export interface BlockTokenizerParsePhaseStateTree<
  M extends YastBlockNodeMeta = YastBlockNodeMeta
  > {
  /**
   * The root node identifier of the ParsePhaseStateTree
   */
  type: 'root'
  /**
   * Metadata of the block data state tree in the parse phase
   */
  meta: M
  /**
   * List of child nodes of current data node
   */
  children: BlockTokenizerParsePhaseState[]
}


/**
 * Hooks in the parse phase
 */
export interface BlockTokenizerParsePhaseHook<
  T extends YastBlockNodeType = YastBlockNodeType,
  MS extends BlockTokenizerMatchPhaseState<T> = BlockTokenizerMatchPhaseState<T>,
  PS extends BlockTokenizerParsePhaseState<T> = BlockTokenizerParsePhaseState<T>,
  > {
  /**
   * Parse matchStates
   *
   * @returns
   *  - {PS}: parsed ParsePhaseState
   *  - {null}: ignore this ParserPhaseState
   */
  parse: (
    matchPhaseState: MS,
    parsedChildren?: BlockTokenizerParsePhaseState[],
  ) => PS | null
}
