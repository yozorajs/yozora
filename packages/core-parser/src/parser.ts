import type { IRoot, YastNodeType } from '@yozora/ast'
import { createNodePointGenerator } from '@yozora/character'
import type {
  IBlockFallbackTokenizer,
  IInlineFallbackTokenizer,
  IInlineTokenizer,
  IMatchBlockHook,
  IMatchInlineHook,
  IParseBlockHook,
  IParseInlineHook,
  IPostMatchBlockHook,
  ITokenizer,
} from '@yozora/core-tokenizer'
import { createPhrasingLineGenerator } from '@yozora/core-tokenizer'
import { PhrasingContentTokenizer } from './phrasing-content/tokenizer'
import { createProcessor } from './processor'
import type {
  IParseOptions,
  IParser,
  ITokenizerHook,
  ITokenizerHookAll,
  ITokenizerHookPhaseFlags,
} from './types'

/**
 * Parameters for constructing a DefaultYastParser.
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
  protected readonly tokenizerHookMap: Map<
    YastNodeType,
    ITokenizer & Partial<ITokenizerHookAll> & IParseBlockHook & IParseInlineHook
  >
  protected readonly inlineTokenizers: IInlineTokenizer[]
  protected readonly inlineTokenizerMap: Map<string, IInlineTokenizer>
  protected readonly matchBlockHooks: Array<ITokenizer & IMatchBlockHook>
  protected readonly postMatchBlockHooks: Array<ITokenizer & IPostMatchBlockHook>
  protected readonly phrasingContentTokenizer: PhrasingContentTokenizer
  protected blockFallbackTokenizer: IBlockFallbackTokenizer | null = null
  protected inlineFallbackTokenizer: IInlineFallbackTokenizer | null = null
  protected defaultParseOptions: Required<IParseOptions> = null as any

  constructor(props: IDefaultParserProps) {
    this.inlineTokenizers = []
    this.inlineTokenizerMap = new Map()
    this.tokenizerHookMap = new Map()
    this.matchBlockHooks = []
    this.postMatchBlockHooks = []
    this.phrasingContentTokenizer = new PhrasingContentTokenizer()

    // Set default IParseOptions
    this.setDefaultParseOptions(props.defaultParseOptions)

    // Register phrasing-content tokenizer.
    this.useTokenizer(new PhrasingContentTokenizer(), undefined, {
      'match-block': false,
      'post-match-block': false,
    })

    // Resolve block fallback tokenizer.
    const blockFallbackTokenizer =
      props.blockFallbackTokenizer != null ? props.blockFallbackTokenizer : null
    if (blockFallbackTokenizer != null) {
      this.useBlockFallbackTokenizer(blockFallbackTokenizer)
    }

    // Resolve inline fallback tokenizer.
    const inlineFallbackTokenizer =
      props.inlineFallbackTokenizer != null ? props.inlineFallbackTokenizer : null
    if (inlineFallbackTokenizer != null) {
      this.useInlineFallbackTokenizer(inlineFallbackTokenizer)
    }
  }

  public useInlineTokenizer(tokenizer: IInlineTokenizer, registerBeforeTokenizer?: string): this {
    this._registerTokenizer(
      this.inlineTokenizers,
      this.inlineTokenizerMap,
      tokenizer,
      registerBeforeTokenizer,
    )
    return this
  }

  public unmountInlineTokenizer(tokenizerOrName: ITokenizer | string): this {
    this._unregisterTokenizer(this.inlineTokenizers, this.inlineTokenizerMap, tokenizerOrName)
    return this
  }

  public replaceInlineTokenizer(
    tokenizer: IInlineTokenizer,
    registerBeforeTokenizer?: string,
  ): this {
    this._replaceTokenizer(
      this.inlineTokenizers,
      this.inlineTokenizerMap,
      tokenizer,
      registerBeforeTokenizer,
    )
    return this
  }

  /**
   * @override
   * @see IParser
   */
  public useTokenizer(
    tokenizer: ITokenizer & (Partial<ITokenizerHook> | never),
    registerBeforeTokenizer?: string,
    lifecycleHookFlags: Partial<ITokenizerHookPhaseFlags> = {},
  ): this {
    // Check if the tokenizer name has been registered by other tokenizer.
    const olderTokenizer = this.tokenizerHookMap.get(tokenizer.name)
    if (olderTokenizer != null) {
      throw new TypeError(`[useTokenizer] Name(${tokenizer.name}) has been registered.`)
    }

    const hook = tokenizer as ITokenizer & ITokenizerHookAll
    this.tokenizerHookMap.set(tokenizer.name, hook)

    // Register into this.*Hooks.
    const registerIntoHooks = (hooks: ITokenizer[], flag: keyof ITokenizerHookPhaseFlags): void => {
      if (lifecycleHookFlags[flag] === false) return
      let index = 0
      for (; index < hooks.length; ++index) {
        const t = hooks[index]
        if (registerBeforeTokenizer === t.name) break
        if (hook.priority > t.priority) break
      }
      if (index < 0 || index >= hooks.length) hooks.push(hook)
      else hooks.splice(index, 0, hook)
    }

    // match-block phase
    if (hook.eatOpener != null) {
      registerIntoHooks(this.matchBlockHooks, 'match-block')
    }

    // post-match-block phase
    if (hook.transformMatch != null) {
      registerIntoHooks(this.postMatchBlockHooks, 'post-match-block')
    }
    return this
  }

  /**
   * @override
   * @see IParser
   */
  public replaceTokenizer(
    tokenizer: ITokenizer & (Partial<ITokenizerHook> | never),
    registerBeforeTokenizer?: string,
    lifecycleHookFlags?: Partial<ITokenizerHookPhaseFlags>,
  ): this {
    this.unmountTokenizer(tokenizer.name)
    this.useTokenizer(tokenizer, registerBeforeTokenizer, lifecycleHookFlags)
    return this
  }

  /**
   * @override
   * @see IParser
   */
  public unmountTokenizer(tokenizerOrName: ITokenizer | string): this {
    const tokenizerName =
      typeof tokenizerOrName === 'string' ? tokenizerOrName : tokenizerOrName.name

    const existed: boolean = this.tokenizerHookMap.delete(tokenizerName)
    if (!existed) return this

    // Check if its blockFallbackTokenizer
    if (this.blockFallbackTokenizer == null || this.blockFallbackTokenizer.name === tokenizerName) {
      this.blockFallbackTokenizer = null
    }

    // Check if it is inlineFallbackTokenizer
    else if (
      this.inlineFallbackTokenizer == null ||
      this.inlineFallbackTokenizer.name === tokenizerName
    ) {
      this.inlineFallbackTokenizer = null
    }

    // Unmount from hooks.
    const unmountFromHooks = (hooks: ITokenizer[]): void => {
      const hookIndex = hooks.findIndex(hook => hook.name === tokenizerName)
      if (hookIndex >= 0) hooks.splice(hookIndex, 1)
    }

    unmountFromHooks(this.matchBlockHooks)
    unmountFromHooks(this.postMatchBlockHooks)
    return this
  }

  /**
   * @override
   * @see IParser
   */
  public useBlockFallbackTokenizer(blockFallbackTokenizer: IBlockFallbackTokenizer): this {
    // Unmount old fallback tokenizer
    if (this.blockFallbackTokenizer != null) {
      this.unmountTokenizer(this.blockFallbackTokenizer)
    }

    // register fallback tokenizer
    this.useTokenizer(blockFallbackTokenizer, undefined, {
      'match-block': false,
      'post-match-block': false,
    })

    this.blockFallbackTokenizer = blockFallbackTokenizer
    return this
  }

  /**
   * @override
   * @see IParser
   */
  public useInlineFallbackTokenizer(inlineFallbackTokenizer: IInlineFallbackTokenizer): this {
    // Unmount old fallback tokenizer
    if (this.inlineFallbackTokenizer != null) {
      this.unmountTokenizer(this.inlineFallbackTokenizer)
    }

    // register fallback tokenizer
    this.useTokenizer(inlineFallbackTokenizer, undefined, {
      'match-block': false,
      'post-match-block': false,
    })

    this.inlineFallbackTokenizer = inlineFallbackTokenizer
    return this
  }

  /**
   * @override
   * @see IParser
   */
  public setDefaultParseOptions(options: Partial<IParseOptions> = {}): void {
    this.defaultParseOptions = {
      presetDefinitions: [],
      presetFootnoteDefinitions: [],
      shouldReservePosition: false,
      ...options,
    }
  }

  /**
   * @override
   * @see IParser
   */
  public parse(contents: Iterable<string> | string, options: IParseOptions = {}): IRoot {
    const { shouldReservePosition, presetDefinitions, presetFootnoteDefinitions } = {
      ...this.defaultParseOptions,
      ...options,
    }

    // calc nodePoints from content
    const nodePointsIterator = createNodePointGenerator(contents)
    const linesIterator = createPhrasingLineGenerator(nodePointsIterator)
    const processor = createProcessor({
      tokenizerHookMap: this.tokenizerHookMap,
      matchBlockHooks: this.matchBlockHooks,
      postMatchBlockHooks: this.postMatchBlockHooks,
      inlineTokenizers: this.inlineTokenizers,
      inlineTokenizerMap: this.inlineTokenizerMap,
      phrasingContentTokenizer: this.phrasingContentTokenizer,
      blockFallbackTokenizer: this.blockFallbackTokenizer,
      inlineFallbackTokenizer: this.inlineFallbackTokenizer,
      shouldReservePosition,
      presetDefinitions,
      presetFootnoteDefinitions,
    })
    const root: IRoot = processor.process(linesIterator)
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
    if (!tokenizerMap.has(tokenizer.name)) {
      let index = 0
      for (; index < tokenizers.length; ++index) {
        const t = tokenizers[index]
        if (registerBeforeTokenizer === t.name) break
        if (tokenizer.priority > t.priority) break
      }
      if (index < 0 || index >= tokenizers.length) tokenizers.push(tokenizer)
      else tokenizers.splice(index, 0, tokenizer)
    }
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
