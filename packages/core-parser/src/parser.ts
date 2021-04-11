import type { Root, YastNodeType } from '@yozora/ast'
import { createNodePointGenerator } from '@yozora/character'
import type {
  BlockFallbackTokenizer,
  InlineFallbackTokenizer,
  Tokenizer,
  TokenizerMatchBlockHook,
  TokenizerMatchInlineHook,
  TokenizerParseBlockHook,
  TokenizerParseInlineHook,
  TokenizerPostMatchBlockHook,
} from '@yozora/core-tokenizer'
import { createPhrasingLineGenerator } from '@yozora/core-tokenizer'
import { PhrasingContentTokenizer } from './phrasing-content/tokenizer'
import { createProcessor } from './processor'
import type {
  ParseOptions,
  TokenizerHook,
  TokenizerHookAll,
  TokenizerHookPhaseFlags,
  YastParser,
} from './types'

/**
 * Parameters for constructing a DefaultYastParser.
 */
export interface DefaultYastParserProps {
  /**
   * Fallback tokenizer on processing block structure phase.
   */
  readonly blockFallbackTokenizer?: BlockFallbackTokenizer

  /**
   * Fallback tokenizer on processing inline structure phase.
   */
  readonly inlineFallbackTokenizer?: InlineFallbackTokenizer

  /**
   * Whether it is necessary to reserve the position in the YastNode produced.
   * @default false
   */
  readonly shouldReservePosition?: boolean
}

export class DefaultYastParser implements YastParser {
  protected readonly tokenizerHookMap: Map<
    YastNodeType,
    Tokenizer &
      Partial<TokenizerHookAll> &
      TokenizerParseBlockHook &
      TokenizerParseInlineHook
  >
  protected readonly matchBlockHooks: Array<Tokenizer & TokenizerMatchBlockHook>
  protected readonly postMatchBlockHooks: Array<
    Tokenizer & TokenizerPostMatchBlockHook
  >
  protected readonly matchInlineHooks: Array<
    Tokenizer & TokenizerMatchInlineHook
  >
  protected readonly phrasingContentTokenizer: PhrasingContentTokenizer
  protected blockFallbackTokenizer: BlockFallbackTokenizer | null = null
  protected inlineFallbackTokenizer: InlineFallbackTokenizer | null = null
  protected defaultShouldReservePosition: boolean

  constructor(props: DefaultYastParserProps) {
    this.defaultShouldReservePosition =
      props.shouldReservePosition == null
        ? false
        : Boolean(props.shouldReservePosition)

    this.tokenizerHookMap = new Map()
    this.matchBlockHooks = []
    this.postMatchBlockHooks = []
    this.matchInlineHooks = []
    this.phrasingContentTokenizer = new PhrasingContentTokenizer()

    // Register phrasing-content tokenizer.
    this.useTokenizer(new PhrasingContentTokenizer(), {
      'match-block': false,
      'post-match-block': false,
      'match-inline': false,
    })

    // Resolve block fallback tokenizer.
    const blockFallbackTokenizer =
      props.blockFallbackTokenizer != null ? props.blockFallbackTokenizer : null
    if (blockFallbackTokenizer != null) {
      this.useBlockFallbackTokenizer(blockFallbackTokenizer)
    }

    // Resolve inline fallback tokenizer.
    const inlineFallbackTokenizer =
      props.inlineFallbackTokenizer != null
        ? props.inlineFallbackTokenizer
        : null
    if (inlineFallbackTokenizer != null) {
      this.useInlineFallbackTokenizer(inlineFallbackTokenizer)
    }
  }

  /**
   * @override
   * @see YastParser
   */
  public useTokenizer(
    tokenizer: Tokenizer & (Partial<TokenizerHook> | never),
    lifecycleHookFlags: Partial<TokenizerHookPhaseFlags> = {},
    registerBeforeTokenizer?: string,
  ): this {
    // Check if the tokenizer name has been registered by other tokenizer.
    const olderTokenizer = this.tokenizerHookMap.get(tokenizer.name)
    if (olderTokenizer != null) {
      throw new TypeError(
        `[useTokenizer] Name(${tokenizer.name}) has been registered.`,
      )
    }

    const hook = tokenizer as Tokenizer & TokenizerHookAll
    this.tokenizerHookMap.set(tokenizer.name, hook)

    // Register into this.*Hooks.
    const registerIntoHooks = (
      hooks: Tokenizer[],
      flag: keyof TokenizerHookPhaseFlags,
    ): void => {
      if (lifecycleHookFlags[flag] === false) return
      let index = 0
      for (; index < hooks.length; ++index) {
        const h = hooks[index]
        if (registerBeforeTokenizer === h.name) break
        if (hook.priority > h.priority) break
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

    // match-inline phase
    if (hook.findDelimiter != null) {
      hook.isDelimiterPair =
        hook.isDelimiterPair == null
          ? () => ({ paired: true })
          : hook.isDelimiterPair
      hook.processDelimiterPair =
        hook.processDelimiterPair == null
          ? (openerDelimiter, closerDelimiter, innerTokens) => ({
              token: innerTokens,
            })
          : hook.processDelimiterPair.bind(hook)
      hook.processFullDelimiter =
        hook.processFullDelimiter == null
          ? () => null
          : hook.processFullDelimiter.bind(hook)

      registerIntoHooks(this.matchInlineHooks, 'match-inline')
    }
    return this
  }

  /**
   * @override
   * @see YastParser
   */
  public unmountTokenizer(tokenizerOrName: Tokenizer | string): this {
    const tokenizerName =
      typeof tokenizerOrName === 'string'
        ? tokenizerOrName
        : tokenizerOrName.name

    const existed: boolean = this.tokenizerHookMap.delete(tokenizerName)
    if (!existed) return this

    // Check if its blockFallbackTokenizer
    if (
      this.blockFallbackTokenizer == null ||
      this.blockFallbackTokenizer.name === tokenizerName
    ) {
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
    const unmountFromHooks = (hooks: Tokenizer[]): void => {
      const hookIndex = hooks.findIndex(hook => hook.name === tokenizerName)
      if (hookIndex >= 0) hooks.splice(hookIndex, 1)
    }

    unmountFromHooks(this.matchBlockHooks)
    unmountFromHooks(this.postMatchBlockHooks)
    unmountFromHooks(this.matchInlineHooks)
    return this
  }

  /**
   * @override
   * @see YastParser
   */
  public useBlockFallbackTokenizer(
    blockFallbackTokenizer: BlockFallbackTokenizer,
  ): this {
    // Unmount old fallback tokenizer
    if (this.blockFallbackTokenizer != null) {
      this.unmountTokenizer(this.blockFallbackTokenizer)
    }

    // register fallback tokenizer
    this.useTokenizer(blockFallbackTokenizer, {
      'match-block': false,
      'post-match-block': false,
      'match-inline': false,
    })

    this.blockFallbackTokenizer = blockFallbackTokenizer
    return this
  }

  /**
   * @override
   * @see YastParser
   */
  public useInlineFallbackTokenizer(
    inlineFallbackTokenizer: InlineFallbackTokenizer,
  ): this {
    // Unmount old fallback tokenizer
    if (this.inlineFallbackTokenizer != null) {
      this.unmountTokenizer(this.inlineFallbackTokenizer)
    }

    // register fallback tokenizer
    this.useTokenizer(inlineFallbackTokenizer, {
      'match-block': false,
      'post-match-block': false,
      'match-inline': false,
    })

    this.inlineFallbackTokenizer = inlineFallbackTokenizer
    return this
  }

  /**
   * @override
   * @see YastParser
   */
  public parse(
    contents: Iterable<string> | string,
    options: ParseOptions = {},
  ): Root {
    const {
      shouldReservePosition = this.defaultShouldReservePosition,
    } = options

    // calc nodePoints from content
    const nodePointsIterator = createNodePointGenerator(contents)
    const linesIterator = createPhrasingLineGenerator(nodePointsIterator)
    const processor = createProcessor({
      tokenizerHookMap: this.tokenizerHookMap,
      matchBlockHooks: this.matchBlockHooks,
      postMatchBlockHooks: this.postMatchBlockHooks,
      matchInlineHooks: this.matchInlineHooks,
      phrasingContentTokenizer: this.phrasingContentTokenizer,
      blockFallbackTokenizer: this.blockFallbackTokenizer,
      inlineFallbackTokenizer: this.inlineFallbackTokenizer,
      shouldReservePosition,
    })
    const root: Root = processor.process(linesIterator)
    return root
  }
}
