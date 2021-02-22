import type { NodePoint } from '@yozora/character'
import type {
  YastMeta,
  YastNode,
  YastNodePosition,
  YastNodeType,
  YastRoot,
} from '@yozora/tokenizercore'
import type {
  PhrasingContent,
  PhrasingContentLine,
  PhrasingContentState,
} from '../phrasing-content/types'
import type {
  TokenizerMatchBlockHook,
  YastBlockState,
} from './lifecycle/match-block'
import type { TokenizerParseBlockHook } from './lifecycle/parse-block'
import type { TokenizerPostMatchBlockHook } from './lifecycle/post-match-block'
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
  | TokenizerMatchBlockHook
  | TokenizerPostMatchBlockHook
  | TokenizerParseBlockHook


export type BlockTokenizerHookAll =
  & TokenizerMatchBlockHook
  & TokenizerPostMatchBlockHook
  & TokenizerParseBlockHook


export type ImmutableBlockTokenizerContext<M extends YastMeta = YastMeta> =
  Pick<
    BlockTokenizerContext<M>,
    | 'buildPhrasingContentState'
    | 'buildPhrasingContent'
    | 'buildBlockState'
    | 'extractPhrasingContentLines'
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
      T, YastBlockState<T> & any, YastNode & any>,
    lazinessTypes?: YastNodeType[],
  ) => this

  /**
   * Register tokenizer and hook into context
   * @param tokenizer
   * @param lifecycleHookFlags  `false` represented disabled on that phase
   */
  readonly useTokenizer: <T extends YastNodeType>(
    tokenizer:
      & BlockTokenizer<T & any, YastBlockState<T> & any>
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
  ) => YastBlockStateTree

  /**
   * Called on post-match phase
   * @param nodePoints
   * @param stateTree
   */
  readonly postMatch: (
    nodePoints: ReadonlyArray<NodePoint>,
    stateTree: YastBlockStateTree,
  ) => YastBlockStateTree

  /**
   * Called on parse phase
   * @param nodePoints
   * @param stateTree
   */
  readonly parse: (
    nodePoints: ReadonlyArray<NodePoint>,
    stateTree: YastBlockStateTree,
  ) => YastRoot<M>

  /**
   * Build PhrasingContentPostMatchPhaseState from array of PhrasingContentLine
   * @param lines
   */
  readonly buildPhrasingContentState: (
    lines: ReadonlyArray<PhrasingContentLine>,
  ) => PhrasingContentState | null

  /**
   * Build PhrasingContentMatchPhaseState from array of PhrasingContentLine
   *
   * @param nodePoints
   * @param lines
   */
  readonly buildPhrasingContent: (
    state: Readonly<PhrasingContentState>,
  ) => PhrasingContent | null

  /**
   * Build BlockTokenizerPostMatchPhaseState.
   *
   * @param lines
   * @param originalState
   */
  readonly buildBlockState: (
    lines: ReadonlyArray<PhrasingContentLine>,
    originalState: Readonly<YastBlockState>,
  ) => YastBlockState | null

  /**
   * Extract array of PhrasingContentLine from a given YastBlockState.
   * @param state
   */
  readonly extractPhrasingContentLines: (
    originalState: Readonly<YastBlockState>,
  ) => ReadonlyArray<PhrasingContentLine> | null
}


/**
 * Tree of YastBlockState nodes.
 */
export interface YastBlockStateTree {
  /**
   * Type of a state node
   */
  type: 'root'
  /**
   * Location of a node in the source contents.
   */
  position: YastNodePosition
  /**
   * List of child node of current state node
   */
  children: YastBlockState[]
}
