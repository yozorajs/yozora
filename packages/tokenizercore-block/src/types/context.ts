import type { NodePoint } from '@yozora/character'
import type {
  YastMeta,
  YastNode,
  YastNodePosition,
  YastNodeType,
  YastRoot,
} from '@yozora/tokenizercore'
import type {
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerMatchPhaseState,
} from './lifecycle/match'
import type { BlockTokenizerParsePhaseHook } from './lifecycle/parse'
import type {
  BlockTokenizerPostMatchPhaseHook,
  BlockTokenizerPostMatchPhaseState,
} from './lifecycle/post-match'
import type {
  PhrasingContent,
  PhrasingContentLine,
  PhrasingContentPostMatchPhaseState,
} from './phrasing-content'
import type { BlockTokenizer, FallbackBlockTokenizer } from './tokenizer'


export type BlockTokenizerPhase =
  | 'match'
  | 'post-match'
  | 'parse'


/**
 * set *false* to disable corresponding hook
 */
export type BlockTokenizerHookFlags = Record<BlockTokenizerPhase, false>


export type BlockTokenizerHook =
  | BlockTokenizerMatchPhaseHook
  | BlockTokenizerPostMatchPhaseHook
  | BlockTokenizerParsePhaseHook


export type BlockTokenizerHookAll =
  & BlockTokenizerMatchPhaseHook
  & BlockTokenizerPostMatchPhaseHook
  & BlockTokenizerParsePhaseHook


export type ImmutableBlockTokenizerContext<M extends YastMeta = YastMeta> =
  Pick<
    BlockTokenizerContext<M>,
    | 'extractPhrasingContentLines'
    | 'buildPhrasingContentPostMatchPhaseState'
    | 'buildPhrasingContentParsePhaseState'
    | 'buildPostMatchPhaseState'
  >


/**
 * Context of BlockTokenizer.
 */
export interface BlockTokenizerContext<M extends YastMeta = YastMeta> {
  /**
   * Register tokenizer and hook into context.
   * @param fallbackTokenizer
   * @param lazinessTypes
   */
  readonly useFallbackTokenizer: <T extends YastNodeType>(
    fallbackTokenizer: FallbackBlockTokenizer<
      T & any,
      BlockTokenizerMatchPhaseState<T> & any,
      BlockTokenizerPostMatchPhaseState<T> & any,
      YastNode & any>,
    lazinessTypes?: YastNodeType[],
  ) => this

  /**
   * Register tokenizer and hook into context
   * @param tokenizer
   * @param lifecycleHookFlags  `false` represented disabled on that phase
   */
  readonly useTokenizer: <T extends YastNodeType>(
    tokenizer:
      & BlockTokenizer<
        T & any,
        BlockTokenizerMatchPhaseState<T> & any,
        BlockTokenizerPostMatchPhaseState<T> & any>
      & Partial<BlockTokenizerHook>,
    lifecycleHookFlags?: Partial<BlockTokenizerHookFlags>,
  ) => this

  /**
   * Remove tokenizer which with the `tokenizerName` from the context.
   * @param tokenizer
   */
  readonly unmountTokenizer: (tokenizerName: string) => this

  /**
   * Called on match phase
   * @param nodePoints
   * @param startIndex
   * @param endIndex
   */
  readonly match: (
    nodePoints: ReadonlyArray<NodePoint>,
    startIndex: number,
    endIndex: number,
  ) => BlockTokenizerContextMatchPhaseStateTree

  /**
   * Called on post-match phase
   * @param nodePoints
   * @param matchPhaseStateTree
   */
  readonly postMatch: (
    nodePoints: ReadonlyArray<NodePoint>,
    matchPhaseStateTree: BlockTokenizerContextMatchPhaseStateTree,
  ) => BlockTokenizerContextPostMatchPhaseStateTree

  /**
   * Called on parse phase
   * @param nodePoints
   * @param postMatchPhaseStateTree
   */
  readonly parse: (
    nodePoints: ReadonlyArray<NodePoint>,
    postMatchPhaseStateTree: BlockTokenizerContextPostMatchPhaseStateTree,
  ) => YastRoot<M>

  /**
   * Extract array of PhrasingContentLine from a given BlockTokenizerMatchPhaseState
   *
   * @param state
   */
  readonly extractPhrasingContentLines: (
    state: BlockTokenizerMatchPhaseState,
  ) => ReadonlyArray<PhrasingContentLine> | null

  /**
   * Build PhrasingContentPostMatchPhaseState from array of PhrasingContentLine
   *
   * @param nodePoints
   * @param lines
   */
  readonly buildPhrasingContentPostMatchPhaseState: (
    nodePoints: ReadonlyArray<NodePoint>,
    lines: ReadonlyArray<PhrasingContentLine>,
  ) => PhrasingContentPostMatchPhaseState | null

  /**
   * Build PhrasingContentMatchPhaseState from array of PhrasingContentLine
   *
   * @param nodePoints
   * @param lines
   */
  readonly buildPhrasingContentParsePhaseState: (
    nodePoints: ReadonlyArray<NodePoint>,
    lines: ReadonlyArray<PhrasingContentLine>,
  ) => PhrasingContent | null

  /**
   * Build BlockTokenizerPostMatchPhaseState.
   *
   * @param lines
   * @param originalState
   */
  readonly buildPostMatchPhaseState: (
    lines: ReadonlyArray<PhrasingContentLine>,
    originalState: BlockTokenizerPostMatchPhaseState,
  ) => BlockTokenizerPostMatchPhaseState | null
}


/**
 * State on match phase of BlockTokenizerContext
 */
export interface BlockTokenizerContextMatchPhaseState {
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
