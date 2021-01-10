import type {
  EnhancedYastNodePoint,
  YastNodePosition,
} from '@yozora/tokenizercore'
import type {
  YastBlockNode,
  YastBlockNodeMeta,
  YastBlockNodeType,
} from './node'
import type {
  BlockTokenizer,
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseHook,
  BlockTokenizerPostMatchPhaseHook,
  BlockTokenizerPostMatchPhaseState,
  BlockTokenizerPostParsePhaseHook,
  PhrasingContentMatchPhaseState,
} from './tokenizer'


export type BlockTokenizerPhase =
  | 'match'
  | 'post-match'
  | 'parse'
  | 'post-parse'


/**
 * set *false* to disable corresponding hook
 */
export type BlockTokenizerHookFlags = {
  'match.list'?: false
  'match.map'?: false
  'post-match.list'?: false
  'parse.map'?: false
  'post-parse.list'?: false
}


export type BlockTokenizerHook =
  | BlockTokenizerMatchPhaseHook
  | BlockTokenizerPostMatchPhaseHook
  | BlockTokenizerParsePhaseHook
  | BlockTokenizerPostParsePhaseHook


export type BlockTokenizerHookAll =
  & BlockTokenizerMatchPhaseHook
  & BlockTokenizerPostMatchPhaseHook
  & BlockTokenizerParsePhaseHook
  & BlockTokenizerPostParsePhaseHook


export type ImmutableBlockTokenizerContext<M extends YastBlockNodeMeta = YastBlockNodeMeta> =
  Pick<
    BlockTokenizerContext<M>,
    | 'match'
    | 'postMatch'
    | 'parse'
    | 'postParse'
    | 'extractPhrasingContentMatchPhaseState'
    | 'buildMatchPhaseState'
    | 'buildPostMatchPhaseState'
  >


/**
 * Context of BlockTokenizer.
 */
export interface BlockTokenizerContext<
  M extends YastBlockNodeMeta = YastBlockNodeMeta
  > {
  /**
   * Register tokenizer and hook into context
   * @param tokenizer
   * @param lifecycleFlags  `false` represented skipped that phase
   */
  useTokenizer: (
    tokenizer:
      & BlockTokenizer<YastBlockNodeType>
      & Partial<BlockTokenizerHook>,
    lifecycleFlags?: Readonly<BlockTokenizerHookFlags>,
  ) => this

  /**
   * Called on match phase
   * @param nodePoints
   * @param startIndex
   * @param endIndex
   */
  match: (
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    startIndex: number,
    endIndex: number,
  ) => BlockTokenizerContextMatchPhaseStateTree

  /**
   * Called on post-match phase
   * @param closedMatchPhaseStateTree
   */
  postMatch: (
    closedMatchPhaseStateTree: BlockTokenizerContextMatchPhaseStateTree,
  ) => BlockTokenizerContextPostMatchPhaseStateTree

  /**
   * Called on parse phase
   * @param closedMatchPhaseStateTree
   */
  parse: (
    closedMatchPhaseStateTree: BlockTokenizerContextPostMatchPhaseStateTree,
  ) => BlockTokenizerContextParsePhaseStateTree<M>

  /**
   * Called on post-parse-phase
   * @param parsePhaseStateTree
   */
  postParse: (
    parsePhaseStateTree: BlockTokenizerContextParsePhaseStateTree<M>,
  ) => BlockTokenizerContextParsePhaseStateTree<M>

  /**
   * Hook for tokenizers to extract PhrasingContentMatchPhaseState
   * from given data.
   * @param state
   */
  extractPhrasingContentMatchPhaseState: (
    state: BlockTokenizerMatchPhaseState,
  ) => PhrasingContentMatchPhaseState | null

  /**
   * Build BlockTokenizerMatchPhaseState from
   * a PhrasingContentMatchPhaseState
   */
  buildMatchPhaseState: (
    originalState: BlockTokenizerMatchPhaseState,
    phrasingContentState: PhrasingContentMatchPhaseState,
  ) => BlockTokenizerMatchPhaseState | null

  /**
   * Build BlockTokenizerPostMatchPhaseState from
   * a PhrasingContentMatchPhaseState
   */
  buildPostMatchPhaseState: (
    originalState: BlockTokenizerMatchPhaseState,
    phrasingContentState: PhrasingContentMatchPhaseState,
  ) => BlockTokenizerMatchPhaseState | null
}


/**
 * State on match phase of BlockTokenizerContext
 */
export interface BlockTokenizerContextMatchPhaseState {
  /**
   * Parent state node.
   */
  parent: BlockTokenizerContextMatchPhaseState
  /**
   * Is it in an opening (modifiable) state.
   * @see https://github.github.com/gfm/#phase-1-block-structure
   */
  opening: boolean
  /**
   * State of tokenizer on match phase.
   */
  data: BlockTokenizerMatchPhaseState
  /**
   * Location of a node in the source contents.
   */
  position: YastNodePosition
  /**
   * List of child node of current state node
   */
  children: BlockTokenizerContextMatchPhaseState[]
}


/**
 * State tree on match phase of BlockTokenizerContext
 */
export interface BlockTokenizerContextMatchPhaseStateTree {
  /**
   * Is it in an opening (modifiable) state.
   * @see https://github.github.com/gfm/#phase-1-block-structure
   */
  opening: boolean
  /**
   * State of tokenizer on match phase.
   */
  data: BlockTokenizerMatchPhaseState
  /**
   * Location of a node in the source contents.
   */
  position: YastNodePosition
  /**
   * List of child node of current state node
   */
  children: BlockTokenizerContextMatchPhaseState[]
}


/**
 * State on post-match phase tree of BlockTokenizerContext
 */
export interface BlockTokenizerContextPostMatchPhaseState
  extends BlockTokenizerPostMatchPhaseState {
  /**
   * List of child node of current state node.
   */
  children?: BlockTokenizerContextPostMatchPhaseState[]
}


/**
 * State on post-match phase of BlockTokenizerContext
 */
export interface BlockTokenizerContextPostMatchPhaseStateTree {
  /**
   * The root node identifier of the BlockTokenizerContextPostMatchPhaseStateTree
   */
  type: 'root'
  /**
   * List of child nodes of current data node
   */
  children: BlockTokenizerContextPostMatchPhaseState[]
}


/**
 * State on parse phase of BlockTokenizerContext
 */
export interface BlockTokenizerContextParsePhaseState extends YastBlockNode {
  /**
   * List of child nodes of current data node
   */
  children?: BlockTokenizerContextParsePhaseState[]
}


/**
 * State-tree on parse phase of BlockTokenizerContext
 */
export interface BlockTokenizerContextParsePhaseStateTree<
  M extends YastBlockNodeMeta = YastBlockNodeMeta
  > {
  /**
   * The root node identifier of the ParsePhaseStateTree
   */
  type: 'root'
  /**
   * Metadata of the block data state tree on the parse phase
   */
  meta: M
  /**
   * List of child nodes of current data node
   */
  children: BlockTokenizerContextParsePhaseState[]
}
