import { YastNodeType } from './node'


/**
 * State of tokenizer hook
 */
export interface TokenizerHookState<S extends TokenizerHookState<S>> {
  /**
   * Type of a state node
   */
  type: YastNodeType
  /**
   * List of child nodes of current data node
   */
  children?: S[]
}


/**
 * State tree of tokenizer hook
 */
export interface TokenizerHookStateTree<S extends TokenizerHookState<S>> {
  /**
   * The root node identifier of the TokenizerHookStateTree
   */
  type: 'root'
  /**
   * List of child nodes of current state node
   */
  children: S[]
}
