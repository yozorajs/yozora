import type { Association, Root } from '@yozora/ast'
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

/**
 * Options for constructing a processor.
 */
export interface IProcessorOptions {
  readonly inlineTokenizers: readonly IInlineTokenizer[]
  readonly inlineTokenizerMap: Readonly<Map<string, IInlineTokenizer>>
  readonly blockTokenizers: readonly IBlockTokenizer[]
  readonly blockTokenizerMap: Readonly<Map<string, IBlockTokenizer>>
  readonly blockFallbackTokenizer: IBlockFallbackTokenizer | null
  readonly inlineFallbackTokenizer: IInlineFallbackTokenizer | null
  readonly shouldReservePosition: boolean
  readonly presetDefinitions: Association[]
  readonly presetFootnoteDefinitions: Association[]
  readonly formatUrl: (url: string) => string
}

/**
 * Result of __handle__
 */
export interface IProcessor {
  /**
   * Parse phrasing lines into Yozora AST Root.
   * @param lines
   */
  process(lines: Iterable<IPhrasingContentLine[]>): Root
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
