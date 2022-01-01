import type { IRoot, IYastAssociation } from '@yozora/ast'
import type {
  IBlockFallbackTokenizer,
  IInlineFallbackTokenizer,
  ITokenizer,
  ITokenizerMatchBlockHook,
  ITokenizerMatchInlineHook,
  ITokenizerParseBlockHook,
  ITokenizerParseInlineHook,
  ITokenizerPostMatchBlockHook,
  IYastBlockToken,
} from '@yozora/core-tokenizer'

export type ITokenizerHookPhase =
  | 'match-block'
  | 'post-match-block'
  // | 'parse-block'
  | 'match-inline'
// | 'parse-inline'

// Set *false* to disable corresponding hook.
export type ITokenizerHookPhaseFlags = Record<ITokenizerHookPhase, false>

export type ITokenizerHook =
  | ITokenizerMatchBlockHook
  | ITokenizerPostMatchBlockHook
  | ITokenizerParseBlockHook
  | ITokenizerMatchInlineHook
  | ITokenizerParseInlineHook

export type ITokenizerHookAll = ITokenizerMatchBlockHook &
  ITokenizerPostMatchBlockHook &
  ITokenizerParseBlockHook &
  ITokenizerMatchInlineHook &
  ITokenizerParseInlineHook

export interface IParseOptions {
  /**
   * Whether it is necessary to reserve the position in the IYastNode produced.
   */
  readonly shouldReservePosition?: boolean

  /**
   * Preset definition meta data list.
   */
  readonly presetDefinitions?: IYastAssociation[]

  /**
   * Preset footnote definition meta data list.
   */
  readonly presetFootnoteDefinitions?: IYastAssociation[]
}

/**
 * Parser for markdown like contents.
 */
export interface IParser {
  /**
   * Register tokenizer and hook into context.
   * @param tokenizer
   * @param registerBeforeTokenizer register to the front of the specified tokenizer
   * @param lifecycleHookFlags      `false` represented disabled on that phase
   */
  useTokenizer(
    tokenizer: ITokenizer & (Partial<ITokenizerHook> | never),
    registerBeforeTokenizer?: string,
    lifecycleHookFlags?: Partial<ITokenizerHookPhaseFlags>,
  ): this

  /**
   * Register tokenizer and hook into context.
   * If the tokenizer.name has been registered, replace it.
   * @param tokenizer
   * @param registerBeforeTokenizer register to the front of the specified tokenizer
   * @param lifecycleHookFlags      `false` represented disabled on that phase
   */
  replaceTokenizer(
    tokenizer: ITokenizer & (Partial<ITokenizerHook> | never),
    registerBeforeTokenizer?: string,
    lifecycleHookFlags?: Partial<ITokenizerHookPhaseFlags>,
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
    blockFallbackTokenizer: IBlockFallbackTokenizer,
  ): this

  /**
   * Register / Replace a fallback tokenizer on phase processing inline structure.
   * @param fallbackTokenizer
   */
  useInlineFallbackTokenizer(
    inlineFallbackTokenizer: IInlineFallbackTokenizer,
  ): this

  /**
   * Set default options for `parser()`
   * @param options
   */
  setDefaultParseOptions(options?: Partial<IParseOptions>): void

  /**
   * Processing raw markdown content into ast object.
   * @param content     source content
   * @param startIndex  start index of content
   * @param endIndex    end index of contents
   */
  parse(contents: Iterable<string> | string, options?: IParseOptions): IRoot
}

/**
 * Hook on match-block phase.
 */
export type IYastMatchPhaseHook = ITokenizer & ITokenizerMatchBlockHook

/**
 * Node on match-block phase.
 */
export interface IYastMatchBlockState {
  /**
   *
   */
  hook: IYastMatchPhaseHook
  /**
   *
   */
  token: IYastBlockToken
}

/**
 * A tree consisted with IYastBlockToken type nodes.
 */
export interface IYastBlockTokenTree extends IYastBlockToken<'root'> {
  /**
   * Child nodes.
   */
  children: IYastBlockToken[]
}
