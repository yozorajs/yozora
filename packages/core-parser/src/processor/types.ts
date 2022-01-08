import type { IRoot, IYastAssociation } from '@yozora/ast'
import type {
  IBlockFallbackTokenizer,
  IBlockTokenizer,
  IInlineFallbackTokenizer,
  IInlineTokenizer,
  IMatchBlockPhaseApi,
  IMatchInlinePhaseApi,
  IParseBlockPhaseApi,
  IParseInlinePhaseApi,
  IPhrasingContentLine,
} from '@yozora/core-tokenizer'
import type { PhrasingContentTokenizer } from '../phrasing-content/tokenizer'

/**
 * Options for constructing a processor.
 */
export interface IProcessorOptions {
  readonly inlineTokenizers: ReadonlyArray<IInlineTokenizer>
  readonly inlineTokenizerMap: Readonly<Map<string, IInlineTokenizer>>
  readonly blockTokenizers: ReadonlyArray<IBlockTokenizer>
  readonly blockTokenizerMap: Readonly<Map<string, IBlockTokenizer>>
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
