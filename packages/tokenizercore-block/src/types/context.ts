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
  PhrasingContent,
  PhrasingContentLine,
  PhrasingContentPostMatchPhaseState,
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
    | 'extractPhrasingContentLines'
    | 'buildPhrasingContentPostMatchPhaseState'
    | 'buildPhrasingContentParsePhaseState'
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
   * @param lifecycleHookFlags  `false` represented skipped that phase
   */
  useTokenizer: <T extends YastBlockNodeType>(
    tokenizer:
      & BlockTokenizer<
        T,
        BlockTokenizerMatchPhaseState<T> & any,
        BlockTokenizerPostMatchPhaseState<T> & any>
      & Partial<BlockTokenizerHook>,
    lifecycleHookFlags?: Readonly<BlockTokenizerHookFlags>,
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
   * @param matchPhaseStateTree
   */
  postMatch: (
    matchPhaseStateTree: BlockTokenizerContextMatchPhaseStateTree,
  ) => BlockTokenizerContextPostMatchPhaseStateTree

  /**
   * Called on parse phase
   * @param postMatchPhaseStateTree
   */
  parse: (
    postMatchPhaseStateTree: BlockTokenizerContextPostMatchPhaseStateTree,
  ) => BlockTokenizerContextParsePhaseStateTree<M>

  /**
   * Called on post-parse-phase
   * @param parsePhaseStateTree
   */
  postParse: (
    parsePhaseStateTree: BlockTokenizerContextParsePhaseStateTree<M>,
  ) => BlockTokenizerContextParsePhaseStateTree<M>

  /**
   * Extract array of PhrasingContentLine from a given BlockTokenizerMatchPhaseState
   *
   * @param state
   */
  extractPhrasingContentLines: (
    state: BlockTokenizerMatchPhaseState,
  ) => ReadonlyArray<PhrasingContentLine> | null

  /**
   * Build PhrasingContentPostMatchPhaseState from array of PhrasingContentLine
   *
   * @param lines
   */
  buildPhrasingContentPostMatchPhaseState: (
    lines: ReadonlyArray<PhrasingContentLine>,
  ) => PhrasingContentPostMatchPhaseState | null

  /**
   * Build PhrasingContentMatchPhaseState from array of PhrasingContentLine
   *
   * @param lines
   */
  buildPhrasingContentParsePhaseState: (
    lines: ReadonlyArray<PhrasingContentLine>,
  ) => PhrasingContent | null

  /**
   * Build BlockTokenizerMatchPhaseState.
   *
   * @param originalState
   * @param lines
   */
  buildMatchPhaseState: (
    originalState: BlockTokenizerMatchPhaseState,
    lines: ReadonlyArray<PhrasingContentLine>,
  ) => BlockTokenizerMatchPhaseState | null

  /**
   * Build BlockTokenizerPostMatchPhaseState.
   *
   * @param originalState
   * @param lines
   */
  buildPostMatchPhaseState: (
    originalState: BlockTokenizerPostMatchPhaseState,
    lines: ReadonlyArray<PhrasingContentLine>,
  ) => BlockTokenizerPostMatchPhaseState | null
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
   * Location of a node in the source contents.
   */
  position: YastNodePosition
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
