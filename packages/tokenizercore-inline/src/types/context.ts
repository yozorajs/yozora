import type {
  EnhancedYastNodePoint,
  YastMeta,
  YastNodeInterval,
} from '@yozora/tokenizercore'
import type { IntervalNode } from '../util/interval'
import type { YastInlineNode } from './node'
import type {
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerMatchPhaseState,
} from './tokenizer/lifecycle/match'
import type {
  InlineTokenizerParsePhaseHook,
  InlineTokenizerParsePhaseStateTree,
} from './tokenizer/lifecycle/parse'
import type {
  InlineTokenizerPostMatchPhaseHook,
  InlineTokenizerPostMatchPhaseState,
} from './tokenizer/lifecycle/post-match'
import type { InlineTokenizer } from './tokenizer/tokenizer'


export type InlineTokenizerPhase =
  | 'match'
  | 'post-match'
  | 'parse'


/**
 * set *false* to disable corresponding hook
 */
export type InlineTokenizerHookFlags = {
  'match.list'?: false
  'match.map'?: false
  'post-match.list'?: false
  'parse.map'?: false
}


export type InlineTokenizerHook =
  | InlineTokenizerMatchPhaseHook
  | InlineTokenizerPostMatchPhaseHook
  | InlineTokenizerParsePhaseHook


export type InlineTokenizerHookAll =
  & InlineTokenizerMatchPhaseHook
  & InlineTokenizerPostMatchPhaseHook
  & InlineTokenizerParsePhaseHook


export type ImmutableInlineTokenizerContext<M extends YastMeta = YastMeta> =
  Pick<
    InlineTokenizerContext<M>,
    | 'match'
    | 'postMatch'
    | 'parse'
  >


/**
 * Context of InlineTokenizer.
 */
export interface InlineTokenizerContext<M extends YastMeta = YastMeta> {
  /**
   * Register tokenizer and hook into context
   * @param tokenizer
   * @param lifecycleFlags  `false` represented skipped that phase
   */
  useTokenizer(
    tokenizer: InlineTokenizer & Partial<InlineTokenizerHook>,
    lifecycleFlags?: Partial<InlineTokenizerHookFlags>,
  ): this

  /**
   * Called in match phase
   *
   * @param nodePoints      An array of EnhancedYastNodePoint
   * @param meta            Meta of the Yast
   * @param startIndex
   * @param endIndex
   */
  match(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    meta: Readonly<M>,
    startIndex: number,
    endIndex: number,
  ): InlineTokenizerContextMatchPhaseStateTree

  /**
   * Called in post-match phase
   *
   * @param nodePoints      An array of EnhancedYastNodePoint
   * @param meta            Meta of the Yast
   * @param matchPhaseStateTree
   */
  postMatch(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    meta: Readonly<M>,
    matchPhaseStateTree: InlineTokenizerContextMatchPhaseStateTree,
  ): InlineTokenizerContextPostMatchPhaseStateTree

  /**
   * Called in parse phase
   *
   * @param nodePoints      An array of EnhancedYastNodePoint
   * @param meta            Meta of the Yast
   * @param postMatchPhaseStateTree
   */
  parse(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    meta: Readonly<M>,
    postMatchPhaseStateTree: InlineTokenizerContextPostMatchPhaseStateTree,
  ): InlineTokenizerParsePhaseStateTree
}


/**
 * State on match phase of InlineTokenizerContext
 */
export interface InlineTokenizerContextMatchPhaseState
  extends IntervalNode<InlineTokenizerContextMatchPhaseState> {
  /**
   * State on match phase of tokenizer.
   */
  data: InlineTokenizerMatchPhaseState
  /**
   * Expose the internal list of raw content fragments that need further
   * processing, the list will be handed over to the context for recursive
   * analysis to get the internal tokens of the current inline token.
   *
   * These content fragments will be processed before assemblePreMatchState.
   */
  innerRawContents?: YastNodeInterval[]
}


/**
 * Root state on match phase of InlineTokenizerContext
 */
export interface InlineTokenizerContextMatchPhaseStateTree
  extends IntervalNode<InlineTokenizerContextMatchPhaseState> {
  /**
   * State on match phase of tokenizer.
   */
  data: InlineTokenizerMatchPhaseState
  /**
   * Expose the internal list of raw content fragments that need further
   * processing, the list will be handed over to the context for recursive
   * analysis to get the internal tokens of the current inline token.
   *
   * These content fragments will be processed before assemblePreMatchState.
   */
  innerRawContents?: YastNodeInterval[]
}


/**
 * State on post-match phase of InlineTokenizerContext
 */
export interface InlineTokenizerContextPostMatchPhaseState
  extends InlineTokenizerPostMatchPhaseState {
  /**
   * List of child node of current state node.
   */
  children?: InlineTokenizerContextPostMatchPhaseState[]
}


/**
 * State-tree on post-match phase of InlineTokenizerContext
 */
export interface InlineTokenizerContextPostMatchPhaseStateTree {
  /**
   * The root node identifier.
   */
  type: 'root'
  /**
   * List of child nodes of current data node.
   */
  children: InlineTokenizerContextPostMatchPhaseState[]
}


export interface InlineTokenizerContextParsePhaseState extends YastInlineNode {
  /**
   * List of child nodes of current data node.
   */
  children?: InlineTokenizerContextParsePhaseState[]
}


/**
 * State-tree on parse phase of InlineTokenizerContext
 */
export interface InlineTokenizerContextParsePhaseStateTree {
  /**
   * The root node identifier.
   */
  type: 'root'
  /**
   * List of child nodes of current data node.
   */
  children: InlineTokenizerContextParsePhaseState[]
}
