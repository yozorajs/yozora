import type { IRoot, IYastAssociation, YastNodeType } from '@yozora/ast'
import type {
  IBlockFallbackTokenizer,
  IInlineFallbackTokenizer,
  IMatchBlockHook,
  IMatchBlockPhaseApi,
  IMatchInlineHook,
  IMatchInlinePhaseApi,
  IParseBlockHook,
  IParseBlockPhaseApi,
  IParseInlineHook,
  IParseInlinePhaseApi,
  IPhrasingContentLine,
  IPostMatchBlockHook,
  IPostMatchBlockPhaseApi,
  ITokenizer,
} from '@yozora/core-tokenizer'
import type { PhrasingContentTokenizer } from '../phrasing-content/tokenizer'
import type { ITokenizerHookAll } from '../types'

/**
 * Options for constructing a processor.
 */
export interface IProcessorOptions {
  readonly tokenizerHookMap: ReadonlyMap<
    YastNodeType,
    ITokenizer & Partial<ITokenizerHookAll> & IParseBlockHook & IParseInlineHook
  >
  readonly matchBlockHooks: ReadonlyArray<ITokenizer & IMatchBlockHook>
  readonly postMatchBlockHooks: ReadonlyArray<ITokenizer & IPostMatchBlockHook>
  readonly matchInlineHooks: ReadonlyArray<ITokenizer & IMatchInlineHook>
  readonly phrasingContentTokenizer: PhrasingContentTokenizer
  readonly blockFallbackTokenizer: IBlockFallbackTokenizer | null
  readonly inlineFallbackTokenizer: IInlineFallbackTokenizer | null
  readonly shouldReservePosition: boolean
  readonly presetDefinitions: IYastAssociation[]
  readonly presetFootnoteDefinitions: IYastAssociation[]
}

/**
 * Result of __handle__
 */
export interface IProcessor {
  /**
   * Parse phrasing lines into Yozora AST Root.
   * @param lines
   */
  process(lines: Iterable<IPhrasingContentLine[]>): IRoot
}

/**
 * Processor apis
 */
export interface IProcessorApis {
  /**
   * Api in match-block phase.
   */
  matchBlockApi: IMatchBlockPhaseApi
  /**
   * Api in post-match-block phase.
   */
  postMatchBlockApi: IPostMatchBlockPhaseApi
  /**
   * Api in parse-block phase.
   */
  parseBlockApi: IParseBlockPhaseApi
  /**
   * Api in match-inline phase.
   */
  matchInlineApi: Omit<IMatchInlinePhaseApi, 'resolveInternalTokens'>
  /**
   * Api in parse-inline phase.
   */
  parseInlineApi: IParseInlinePhaseApi
}
