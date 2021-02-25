import type {
  BlockFallbackTokenizer,
  InlineFallbackTokenizer,
  Tokenizer,
  TokenizerMatchBlockHook,
  TokenizerMatchInlineHook,
  TokenizerParseBlockHook,
  TokenizerParseInlineHook,
  TokenizerParseMetaHook,
  TokenizerPostMatchBlockHook,
  YastBlockState,
  YastMeta,
  YastNode,
  YastNodePosition,
  YastNodeType,
  YastRoot,
  YastToken,
} from '@yozora/core-tokenizer'

export type TokenizerHookPhase =
  | 'match-block'
  | 'post-match-block'
  | 'parse-block'
  | 'parse-meta'
  | 'match-inline'
  | 'parse-inline'

// Set *false* to disable corresponding hook.
export type TokenizerHookPhaseFlags = Record<TokenizerHookPhase, false>

export type TokenizerHook =
  | TokenizerMatchBlockHook
  | TokenizerPostMatchBlockHook
  | TokenizerParseBlockHook
  | TokenizerParseMetaHook
  | TokenizerMatchInlineHook
  | TokenizerParseInlineHook

export type TokenizerHookAll = TokenizerMatchBlockHook &
  TokenizerPostMatchBlockHook &
  TokenizerParseBlockHook &
  TokenizerParseMetaHook &
  TokenizerMatchInlineHook &
  TokenizerParseInlineHook

/**
 * Parser for markdown like contents.
 */
export interface YastParser {
  /**
   * Register tokenizer and hook into context.
   * @param tokenizer
   * @param lifecycleHookFlags  `false` represented disabled on that phase
   */
  useTokenizer: (
    tokenizer: Tokenizer & (Partial<TokenizerHook> | never),
    lifecycleHookFlags?: Partial<TokenizerHookPhaseFlags>,
  ) => this

  /**
   * Remove tokenizer which with the `tokenizerName` from the context.
   * @param tokenizer
   */
  unmountTokenizer: (tokenizerName: string) => this

  /**
   * Register / Replace a fallback tokenizer on phase processing block structure.
   * @param fallbackTokenizer
   * @param lazinessTypes
   */
  useBlockFallbackTokenizer: <T extends YastNodeType>(
    blockFallbackTokenizer: BlockFallbackTokenizer<
      T,
      YastBlockState<T> & any,
      YastNode & any
    >,
    lazinessTypes?: YastNodeType[],
  ) => this

  /**
   * Register / Replace a fallback tokenizer on phase processing inline structure.
   * @param fallbackTokenizer
   */
  useInlineFallbackTokenizer: (
    inlineFallbackTokenizer: InlineFallbackTokenizer<
      YastNodeType,
      YastMeta & any,
      YastToken & any,
      YastNode & any
    >,
  ) => this

  /**
   * Processing raw markdown content into ast object.
   * @param content     source content
   * @param startIndex  start index of content
   * @param endIndex    end index of contents
   */
  parse(content: string, startIndex?: number, endIndex?: number): YastRoot
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
