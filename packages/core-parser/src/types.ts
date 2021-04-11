import type { Root } from '@yozora/ast'
import type {
  BlockFallbackTokenizer,
  InlineFallbackTokenizer,
  Tokenizer,
  TokenizerMatchBlockHook,
  TokenizerMatchInlineHook,
  TokenizerParseBlockHook,
  TokenizerParseInlineHook,
  TokenizerPostMatchBlockHook,
  YastBlockToken,
} from '@yozora/core-tokenizer'

export type TokenizerHookPhase =
  | 'match-block'
  | 'post-match-block'
  // | 'parse-block'
  | 'match-inline'
// | 'parse-inline'

// Set *false* to disable corresponding hook.
export type TokenizerHookPhaseFlags = Record<TokenizerHookPhase, false>

export type TokenizerHook =
  | TokenizerMatchBlockHook
  | TokenizerPostMatchBlockHook
  | TokenizerParseBlockHook
  | TokenizerMatchInlineHook
  | TokenizerParseInlineHook

export type TokenizerHookAll = TokenizerMatchBlockHook &
  TokenizerPostMatchBlockHook &
  TokenizerParseBlockHook &
  TokenizerMatchInlineHook &
  TokenizerParseInlineHook

export interface ParseOptions {
  /**
   * Whether it is necessary to reserve the position in the YastNode produced.
   * @default ${yastParser.shouldReservePosition}
   */
  shouldReservePosition?: boolean
}

/**
 * Parser for markdown like contents.
 */
export interface YastParser {
  /**
   * Register tokenizer and hook into context.
   * @param tokenizer
   * @param registerBeforeTokenizer register to the front of the specified tokenizer
   * @param lifecycleHookFlags      `false` represented disabled on that phase
   */
  useTokenizer(
    tokenizer: Tokenizer & (Partial<TokenizerHook> | never),
    registerBeforeTokenizer?: string,
    lifecycleHookFlags?: Partial<TokenizerHookPhaseFlags>,
  ): this

  /**
   * Remove tokenizer which with the `tokenizerName` from the context.
   * @param tokenizer
   */
  unmountTokenizer(tokenizerName: string): this

  /**
   * Register / Replace a fallback tokenizer on phase processing block structure.
   * @param fallbackTokenizer
   */
  useBlockFallbackTokenizer(
    blockFallbackTokenizer: BlockFallbackTokenizer,
  ): this

  /**
   * Register / Replace a fallback tokenizer on phase processing inline structure.
   * @param fallbackTokenizer
   */
  useInlineFallbackTokenizer(
    inlineFallbackTokenizer: InlineFallbackTokenizer,
  ): this

  /**
   * Processing raw markdown content into ast object.
   * @param content     source content
   * @param startIndex  start index of content
   * @param endIndex    end index of contents
   */
  parse(contents: Iterable<string> | string, options?: ParseOptions): Root
}

/**
 * Hook on match-block phase.
 */
export type YastMatchPhaseHook = Tokenizer & TokenizerMatchBlockHook

/**
 * Node on match-block phase.
 */
export interface YastMatchBlockState {
  /**
   *
   */
  hook: YastMatchPhaseHook
  /**
   *
   */
  token: YastBlockToken
}

/**
 * A tree consisted with YastBlockToken type nodes.
 */
export interface YastBlockTokenTree extends YastBlockToken<'root'> {
  /**
   * Child nodes.
   */
  children: YastBlockToken[]
}
