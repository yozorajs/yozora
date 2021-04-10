import type { Root, YastNodeType } from '@yozora/ast'
import type {
  BlockFallbackTokenizer,
  InlineFallbackTokenizer,
  MatchBlockPhaseApi,
  MatchInlinePhaseApi,
  ParseBlockPhaseApi,
  ParseInlinePhaseApi,
  PhrasingContentLine,
  PostMatchBlockPhaseApi,
  Tokenizer,
  TokenizerMatchBlockHook,
  TokenizerMatchInlineHook,
  TokenizerParseBlockHook,
  TokenizerParseInlineHook,
  TokenizerPostMatchBlockHook,
} from '@yozora/core-tokenizer'
import type { PhrasingContentTokenizer } from '../phrasing-content/tokenizer'
import type { TokenizerHookAll } from '../types'

/**
 * Options for constructing a processor.
 */
export interface ProcessorOptions {
  readonly tokenizerHookMap: ReadonlyMap<
    YastNodeType,
    Tokenizer &
      Partial<TokenizerHookAll> &
      TokenizerParseBlockHook &
      TokenizerParseInlineHook
  >
  readonly matchBlockHooks: ReadonlyArray<Tokenizer & TokenizerMatchBlockHook>
  readonly postMatchBlockHooks: ReadonlyArray<
    Tokenizer & TokenizerPostMatchBlockHook
  >
  readonly matchInlineHooks: ReadonlyArray<Tokenizer & TokenizerMatchInlineHook>
  readonly phrasingContentTokenizer: PhrasingContentTokenizer
  readonly blockFallbackTokenizer: BlockFallbackTokenizer | null
  readonly inlineFallbackTokenizer: InlineFallbackTokenizer | null
  readonly shouldReservePosition: boolean
}

/**
 * Result of __handle__
 */
export interface Processor {
  /**
   * Parse phrasing lines into Yozora AST Root.
   * @param lines
   */
  process(lines: Iterable<PhrasingContentLine[]>): Root
}

/**
 * Processor apis
 */
export interface ProcessorApis {
  /**
   * Api in match-block phase.
   */
  matchBlockApi: MatchBlockPhaseApi
  /**
   * Api in post-match-block phase.
   */
  postMatchBlockApi: PostMatchBlockPhaseApi
  /**
   * Api in parse-block phase.
   */
  parseBlockApi: ParseBlockPhaseApi
  /**
   * Api in match-inline phase.
   */
  matchInlineApi: MatchInlinePhaseApi
  /**
   * Api in parse-inline phase.
   */
  parseInlineApi: ParseInlinePhaseApi
}
