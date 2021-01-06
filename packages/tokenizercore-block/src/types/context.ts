import type { YastNodePoint } from '@yozora/tokenizercore'
import type {
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerMatchPhaseStateData,
  ClosedBlockTokenizerMatchPhaseState,
  ClosedBlockTokenizerMatchPhaseStateTree,
} from './lifecycle/match'
import type {
  BlockTokenizerParsePhaseHook,
  BlockTokenizerParsePhaseStateTree,
} from './lifecycle/parse'
import type { BlockTokenizerPostMatchPhaseHook } from './lifecycle/post-match'
import type { BlockTokenizerPostParsePhaseHook } from './lifecycle/post-parse'
import type { YastBlockNodeMeta, YastBlockNodeType } from './node'
import type {
  PhrasingContentMatchPhaseState,
  PhrasingContentMatchPhaseStateData,
} from './phrasing-content'
import type { BlockTokenizer } from './tokenizer'


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
    | 'extractPhrasingContentMS'
    | 'extractPhrasingContentCMS'
    | 'buildFromPhrasingContentCMS'
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
    nodePoints: YastNodePoint[],
    startIndex: number,
    endIndex: number,
  ) => ClosedBlockTokenizerMatchPhaseStateTree

  /**
   * Called on post-match phase
   * @param closedMatchPhaseStateTree
   */
  postMatch: (
    closedMatchPhaseStateTree: ClosedBlockTokenizerMatchPhaseStateTree,
  ) => ClosedBlockTokenizerMatchPhaseStateTree

  /**
   * Called on parse phase
   * @param closedMatchPhaseStateTree
   */
  parse: (
    closedMatchPhaseStateTree: ClosedBlockTokenizerMatchPhaseStateTree,
  ) => BlockTokenizerParsePhaseStateTree<M>

  /**
   * Called on post-parse-phase
   * @param parsePhaseStateTree
   */
  postParse: (
    parsePhaseStateTree: BlockTokenizerParsePhaseStateTree<M>,
  ) => BlockTokenizerParsePhaseStateTree<M>

  /**
   * Hook for tokenizers to extract PhrasingContentMatchPhaseState
   * from given matchPhaseState.
   * @param matchPhaseState
   */
  extractPhrasingContentMS: (
    matchPhaseState: BlockTokenizerMatchPhaseState,
  ) => PhrasingContentMatchPhaseState | null

  /**
   * Hook for tokenizers to extract PhrasingContentMatchPhaseStateData
   * from given matchPhaseStateData.
   * @param matchPhaseStateData
   */
  extractPhrasingContentCMS: (
    matchPhaseStateData: BlockTokenizerMatchPhaseStateData,
  ) => PhrasingContentMatchPhaseStateData | null

  /**
   * Build ClosedBlockTokenizerMatchPhaseState from
   * a ClosedPhrasingContentMatchPhaseStateData
   */
  buildFromPhrasingContentCMS: (
    originalClosedMatchState: ClosedBlockTokenizerMatchPhaseState,
    phrasingContentStateData: PhrasingContentMatchPhaseStateData,
  ) => ClosedBlockTokenizerMatchPhaseState | null
}
