import type { Association, Root } from '@yozora/ast'
import type {
  IBlockFallbackTokenizer,
  IInlineFallbackTokenizer,
  ITokenizer,
} from '@yozora/core-tokenizer'

export interface IParseOptions {
  /**
   * Whether it is necessary to reserve the position in the Node produced.
   */
  readonly shouldReservePosition?: boolean

  /**
   * Preset definition meta data list.
   */
  readonly presetDefinitions?: Association[]

  /**
   * Preset footnote definition meta data list.
   */
  readonly presetFootnoteDefinitions?: Association[]

  /**
   * Format url.
   * @param url
   * @returns
   */
  readonly formatUrl?: (url: string) => string
}

/**
 * Parser for markdown like contents.
 */
export interface IParser {
  /**
   * Register tokenizer and hook into context.
   * @param tokenizer
   * @param registerBeforeTokenizer register to the front of the specified tokenizer
   */
  useTokenizer(tokenizer: ITokenizer, registerBeforeTokenizer?: string): this

  /**
   * Register tokenizer and hook into context.
   * If the tokenizer.name has been registered, replace it.
   * @param tokenizer
   * @param registerBeforeTokenizer register to the front of the specified tokenizer
   */
  replaceTokenizer(tokenizer: ITokenizer, registerBeforeTokenizer?: string): this

  /**
   * Remove tokenizer which with the `tokenizerName` from the context.
   * @param tokenizerName
   */
  unmountTokenizer(tokenizerName: string): this

  /**
   * Register / Replace a fallback tokenizer on phase processing block structure.
   * @param fallbackTokenizer
   */
  useFallbackTokenizer(fallbackTokenizer: IBlockFallbackTokenizer | IInlineFallbackTokenizer): this

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
  parse(contents: Iterable<string> | string, options?: IParseOptions): Root
}
