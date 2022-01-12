import type { Root } from '@yozora/ast'
import { createNodePointGenerator } from '@yozora/character'
import type {
  IBlockFallbackTokenizer,
  IBlockTokenizer,
  IInlineFallbackTokenizer,
  IInlineTokenizer,
  ITokenizer,
} from '@yozora/core-tokenizer'
import { TokenizerType, createPhrasingLineGenerator } from '@yozora/core-tokenizer'
import { createProcessor } from './processor'
import type { IParseOptions, IParser } from './types'

/**
 * Parameters for constructing a DefaultParser.
 */
export interface IDefaultParserProps {
  /**
   * Fallback tokenizer on processing block structure phase.
   */
  readonly blockFallbackTokenizer?: IBlockFallbackTokenizer

  /**
   * Fallback tokenizer on processing inline structure phase.
   */
  readonly inlineFallbackTokenizer?: IInlineFallbackTokenizer

  /**
   * Default options for `parse()`
   */
  readonly defaultParseOptions?: IParseOptions
}

export class DefaultParser implements IParser {
  protected readonly blockTokenizers: IBlockTokenizer[]
  protected readonly blockTokenizerMap: Map<string, IBlockTokenizer>
  protected readonly inlineTokenizers: IInlineTokenizer[]
  protected readonly inlineTokenizerMap: Map<string, IInlineTokenizer>

  protected blockFallbackTokenizer: IBlockFallbackTokenizer | null = null
  protected inlineFallbackTokenizer: IInlineFallbackTokenizer | null = null
  protected defaultParseOptions: Required<IParseOptions> = null as any

  constructor(props: IDefaultParserProps) {
    this.inlineTokenizers = []
    this.inlineTokenizerMap = new Map()
    this.blockTokenizers = []
    this.blockTokenizerMap = new Map()

    // Set default IParseOptions
    this.setDefaultParseOptions(props.defaultParseOptions)

    // Resolve block fallback tokenizer.
    if (props.blockFallbackTokenizer) this.useFallbackTokenizer(props.blockFallbackTokenizer)

    // Resolve inline fallback tokenizer.
    if (props.inlineFallbackTokenizer) this.useFallbackTokenizer(props.inlineFallbackTokenizer)
  }

  public useTokenizer(tokenizer: ITokenizer, registerBeforeTokenizer?: string): this {
    const tokenizers: ITokenizer[] =
      tokenizer.type === TokenizerType.BLOCK ? this.blockTokenizers : this.inlineTokenizers
    const tokenizerMap: Map<string, ITokenizer> =
      tokenizer.type === TokenizerType.BLOCK ? this.blockTokenizerMap : this.inlineTokenizerMap
    this._registerTokenizer(tokenizers, tokenizerMap, tokenizer, registerBeforeTokenizer)
    return this
  }

  public replaceTokenizer(tokenizer: ITokenizer, registerBeforeTokenizer?: string): this {
    const tokenizers: ITokenizer[] =
      tokenizer.type === TokenizerType.BLOCK ? this.blockTokenizers : this.inlineTokenizers
    const tokenizerMap: Map<string, ITokenizer> =
      tokenizer.type === TokenizerType.BLOCK ? this.blockTokenizerMap : this.inlineTokenizerMap
    this._replaceTokenizer(tokenizers, tokenizerMap, tokenizer, registerBeforeTokenizer)
    return this
  }

  public unmountTokenizer(tokenizerOrName: ITokenizer | string): this {
    this._unregisterTokenizer(this.inlineTokenizers, this.inlineTokenizerMap, tokenizerOrName)
    this._unregisterTokenizer(this.blockTokenizers, this.blockTokenizerMap, tokenizerOrName)
    return this
  }

  public useFallbackTokenizer(
    fallbackTokenizer: IBlockFallbackTokenizer | IInlineFallbackTokenizer,
  ): this {
    switch (fallbackTokenizer.type) {
      case TokenizerType.BLOCK:
        // Unmount old fallback tokenizer
        if (this.blockFallbackTokenizer) {
          this.unmountTokenizer(this.blockFallbackTokenizer)
        }

        // register fallback tokenizer
        this.blockTokenizerMap.set(fallbackTokenizer.name, fallbackTokenizer)
        this.blockFallbackTokenizer = fallbackTokenizer
        break
      case TokenizerType.INLINE:
        // Unmount old fallback tokenizer
        if (this.inlineFallbackTokenizer) {
          this.unmountTokenizer(this.inlineFallbackTokenizer)
        }

        // register fallback tokenizer
        this.inlineTokenizerMap.set(fallbackTokenizer.name, fallbackTokenizer)
        this.inlineFallbackTokenizer = fallbackTokenizer
        break
    }
    return this
  }

  public setDefaultParseOptions(options: Partial<IParseOptions> = {}): void {
    this.defaultParseOptions = {
      presetDefinitions: [],
      presetFootnoteDefinitions: [],
      shouldReservePosition: false,
      ...options,
    }
  }

  public parse(contents: Iterable<string> | string, options: IParseOptions = {}): Root {
    const { shouldReservePosition, presetDefinitions, presetFootnoteDefinitions } = {
      ...this.defaultParseOptions,
      ...options,
    }

    // calc nodePoints from content
    const nodePointsIterator = createNodePointGenerator(contents)
    const linesIterator = createPhrasingLineGenerator(nodePointsIterator)
    const processor = createProcessor({
      inlineTokenizers: this.inlineTokenizers,
      inlineTokenizerMap: this.inlineTokenizerMap,
      blockTokenizers: this.blockTokenizers,
      blockTokenizerMap: this.blockTokenizerMap,
      blockFallbackTokenizer: this.blockFallbackTokenizer,
      inlineFallbackTokenizer: this.inlineFallbackTokenizer,
      shouldReservePosition,
      presetDefinitions,
      presetFootnoteDefinitions,
    })
    const root: Root = processor.process(linesIterator)
    return root
  }

  protected _replaceTokenizer(
    tokenizers: ITokenizer[],
    tokenizerMap: Map<string, ITokenizer>,
    tokenizer: ITokenizer,
    registerBeforeTokenizer?: string,
  ): void {
    this._unregisterTokenizer(tokenizers, tokenizerMap, tokenizer.name)
    this._registerTokenizer(tokenizers, tokenizerMap, tokenizer, registerBeforeTokenizer)
  }

  protected _registerTokenizer(
    tokenizers: ITokenizer[],
    tokenizerMap: Map<string, ITokenizer>,
    tokenizer: ITokenizer,
    registerBeforeTokenizer?: string,
  ): void {
    if (tokenizerMap.has(tokenizer.name)) {
      // Check if the tokenizer name has been registered by other tokenizer.
      const olderTokenizer = tokenizerMap.get(tokenizer.name)
      if (olderTokenizer != null) {
        throw new TypeError(`[useTokenizer] Name(${tokenizer.name}) has been registered.`)
      }
    }

    tokenizerMap.set(tokenizer.name, tokenizer)

    let index = 0
    for (; index < tokenizers.length; ++index) {
      const t = tokenizers[index]
      if (registerBeforeTokenizer === t.name) break
      if (tokenizer.priority > t.priority) break
    }
    if (index < 0 || index >= tokenizers.length) tokenizers.push(tokenizer)
    else tokenizers.splice(index, 0, tokenizer)
  }

  protected _unregisterTokenizer(
    tokenizers: ITokenizer[],
    tokenizerMap: Map<string, ITokenizer>,
    tokenizerOrName: ITokenizer | string,
  ): void {
    const tokenizerName =
      typeof tokenizerOrName === 'string' ? tokenizerOrName : tokenizerOrName.name

    // Unregister from tokenizerMap.
    const existed: boolean = tokenizerMap.delete(tokenizerName)
    if (!existed) return

    // Check if it is blockFallbackTokenizer
    if (this.blockFallbackTokenizer?.name === tokenizerName) this.blockFallbackTokenizer = null

    // Check if it is inlineFallbackTokenizer
    if (this.inlineFallbackTokenizer?.name === tokenizerName) this.inlineFallbackTokenizer = null

    // Unregister from tokenizers
    const index: number = tokenizers.findIndex(tokenizer => tokenizer.name === tokenizerName)
    if (index >= 0) tokenizers.splice(index, 1)
  }
}
