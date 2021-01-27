import type { EnhancedYastNodePoint, YastMeta } from '@yozora/tokenizercore'
import type {
  ImmutableInlineTokenizerContext,
  InlineTokenizerContext,
  InlineTokenizerHook,
  InlineTokenizerHookAll,
  InlineTokenizerHookFlags,
} from './types/context'
import type { YastInlineNode, YastInlineNodeType } from './types/node'
import type {
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerMatchPhaseState,
  ResultOfProcessDelimiter,
} from './types/tokenizer/lifecycle/match'
import type {
  InlineTokenizerParsePhaseHook,
} from './types/tokenizer/lifecycle/parse'
import type {
  InlineTokenizerPostMatchPhaseHook,
} from './types/tokenizer/lifecycle/post-match'
import type {
  FallbackInlineTokenizer,
  InlineTokenizer,
} from './types/tokenizer/tokenizer'
import invariant from 'tiny-invariant'


/**
 * Params for constructing DefaultInlineTokenizerContext
 */
export interface DefaultInlineTokenizerContextProps {
  /**
   * Fallback tokenizer.
   */
  readonly fallbackTokenizer?: FallbackInlineTokenizer<
    YastInlineNodeType,
    YastMeta & any,
    InlineTokenizerMatchPhaseState & any,
    YastInlineNode & any>
}


/**
 * Default context of InlineTokenizer
 */
export class DefaultInlineTokenizerContext<M extends Readonly<YastMeta> = Readonly<YastMeta>>
  implements InlineTokenizerContext<M> {
  protected readonly getContext = this.createImmutableContext()
  protected readonly fallbackTokenizer: FallbackInlineTokenizer | null = null
  protected readonly matchPhaseHooks:
    (InlineTokenizer & InlineTokenizerMatchPhaseHook)[]
  protected readonly postMatchPhaseHooks:
    (InlineTokenizer & InlineTokenizerPostMatchPhaseHook)[]
  protected readonly parsePhaseHookMap:
    Map<YastInlineNodeType, (InlineTokenizer & InlineTokenizerParsePhaseHook)>

  public constructor(props: DefaultInlineTokenizerContextProps) {
    this.matchPhaseHooks = []
    this.postMatchPhaseHooks = []
    this.parsePhaseHookMap = new Map()

    if (props.fallbackTokenizer != null) {
      this.fallbackTokenizer = props.fallbackTokenizer
      this.useTokenizer(this.fallbackTokenizer, {
        'match': false,
        'post-match': false,
      })
    }
  }

  /**
   * @override
   * @see InlineTokenizerContext
   */
  public useTokenizer(
    tokenizer: InlineTokenizer & (InlineTokenizerHook | void),
    tokenizerHookFlags: Partial<InlineTokenizerHookFlags> = {},
  ): this {
    // eslint-disable-next-line no-param-reassign
    tokenizer.getContext = this.getContext as () => ImmutableInlineTokenizerContext
    const hook = tokenizer as InlineTokenizer & InlineTokenizerHookAll

    // register into this.*Hooks
    const registerIntoHookList = (
      hooks: InlineTokenizer[],
      flag: keyof InlineTokenizerHookFlags,
    ): void => {
      if (tokenizerHookFlags[flag] === false) return
      const index = hooks.findIndex(p => p.priority < hook.priority)
      if (index < 0) hooks.push(hook)
      else hooks.splice(index, 0, hook)
    }

    // register into this.*HookMap
    const registerIntoHookMap = (
      recognizedTypes: YastInlineNodeType[],
      hookMap: Map<YastInlineNodeType, InlineTokenizer>,
      flag: keyof InlineTokenizerHookFlags,
    ): void => {
      if (tokenizerHookFlags[flag] === false) return
      for (const t of recognizedTypes) {
        // There is already a tokenizer for this type of data.
        if (hookMap.has(t)) continue

        hookMap.set(t, hook)
      }
    }

    // match phase
    if (hook.findDelimiter != null) {
      hook.processDelimiter = hook.processDelimiter == null
        ? () => null
        : hook.processDelimiter.bind(hook)
      hook.processFullDelimiter = hook.processFullDelimiter == null
        ? () => null
        : hook.processFullDelimiter.bind(hook)
      registerIntoHookList(this.matchPhaseHooks, 'match')
    }

    // post-match phase
    if (hook.transformMatch != null) {
      registerIntoHookList(this.postMatchPhaseHooks, 'post-match')
    }

    // parse phase
    if (hook.parse != null) {
      registerIntoHookMap(hook.recognizedTypes, this.parsePhaseHookMap, 'parse')
    }

    return this
  }

  /**
   * @override
   * @see InlineTokenizerContext
   */
  public match(
    phrasingContentStartIndex: number,
    phrasingContentEndIndex: number,
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    meta: Readonly<M>,
  ): InlineTokenizerMatchPhaseState[] {
    const hooks: MatchPhaseHook[] = this.matchPhaseHooks.map((hook): MatchPhaseHook => {
      let lastStartIndex: number = phrasingContentStartIndex - 1
      let lastDelimiter: InlineTokenDelimiter | null
      return {
        name: hook.name,
        priority: hook.priority,
        findDelimiter: (startIndex, precedingNodePoint) => {
          if (lastStartIndex >= startIndex) return lastDelimiter
          lastDelimiter = hook.findDelimiter(
            startIndex, phrasingContentEndIndex, precedingNodePoint, nodePoints, meta)
          lastStartIndex = lastDelimiter == null
            ? phrasingContentEndIndex
            : lastDelimiter.startIndex
          return lastDelimiter
        },
        processDelimiter: (openerDelimiter, closerDelimiter, getInnerStates) =>
          hook.processDelimiter!(
            openerDelimiter, closerDelimiter, getInnerStates, nodePoints, meta),
        processFullDelimiter: (fullDelimiter) =>
          hook.processFullDelimiter!(fullDelimiter, nodePoints, meta),
      }
    })

    const processor = createDelimiterProcessor([])
    for (let i = phrasingContentStartIndex; i < phrasingContentEndIndex; ++i) {
      const precedingCodePosition: EnhancedYastNodePoint | null =
        i > phrasingContentEndIndex ? nodePoints[i - 1] : null

      let hook: MatchPhaseHook | null = null
      let delimiter: InlineTokenDelimiter | null = null

      for (let hIndex = 0; hIndex < hooks.length;) {
        const currentHook = hooks[hIndex]
        const currentDelimiter = currentHook.findDelimiter(i, precedingCodePosition)

        // Remove hook if no delimiter matched.
        if (currentDelimiter == null) {
          hooks.splice(hIndex, 1)
          continue
        }

        if (
          delimiter == null ||
          currentDelimiter.startIndex < delimiter.startIndex
        ) {
          hook = currentHook
          delimiter = currentDelimiter
        }

        // Move forward the next index of hooks.
        hIndex += 1
      }

      if (delimiter == null || hook == null) break

      i = delimiter.endIndex - 1
      processor.process(hook, delimiter)
    }

    const statesStack: InlineTokenizerMatchPhaseState[] = processor.collect()
    const resolvedResults = this.resolveFallbackStates(
      statesStack,
      phrasingContentStartIndex,
      phrasingContentEndIndex,
      nodePoints,
      meta,
    )
    return resolvedResults
  }

  /**
   * @override
   * @see InlineTokenizerContext
   */
  public postMatch(
    matchPhaseStates: InlineTokenizerMatchPhaseState[],
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    meta: Readonly<M>,
  ): InlineTokenizerMatchPhaseState[] {
    if (this.postMatchPhaseHooks.length <= 0) return matchPhaseStates

    /**
     * 由于 transformMatch 拥有替换原节点的能力，因此采用后序处理，
     * 防止多次进入到同一节点（替换节点可能会产生一个高阶子树，类似于 List）；
     *
     * Since transformMatch has the ability to replace the original node,
     * post-order processing is used to prevent multiple entry to the same
     * node (replacement of the node may produce a high-order subtree, similar to List)
     */
    const handle = (
      states: InlineTokenizerMatchPhaseState[],
    ): InlineTokenizerMatchPhaseState[] => {
      for (const o of states) {
        if (o.children == null || o.children.length <= 0) continue
        const children = handle(o.children)
        o.children = children
      }

      let results: InlineTokenizerMatchPhaseState[] = states
      for (const hook of this.postMatchPhaseHooks) {
        results = hook.transformMatch(results, nodePoints, meta)
      }
      return results
    }

    const results: InlineTokenizerMatchPhaseState[] = handle(matchPhaseStates)
    return results
  }

  /**
   * @override
   * @see InlineTokenizerContext
   */
  public parse(
    matchPhaseStates: InlineTokenizerMatchPhaseState[],
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    meta: Readonly<M>,
  ): YastInlineNode[] {
    const handle = (
      states: InlineTokenizerMatchPhaseState[],
    ): YastInlineNode[] => {
      const results: YastInlineNode[] = []
      for (const o of states) {
        // Post-order handle: But first check the validity of the current node
        const hook = this.parsePhaseHookMap.get(o.type)

        // cannot find matched tokenizer
        invariant(
          hook != null,
          `[DBTContext#parse] no tokenizer for '${ o.type }' found`
        )

        const children: YastInlineNode[] | undefined = o.children != null
          ? handle(o.children)
          : undefined
        const nodes = hook.parse(o, children, nodePoints, meta)
        results.push(nodes)
      }
      return results
    }

    const results: YastInlineNode[] = handle(matchPhaseStates)
    return results
  }

  /**
   * @override
   * @see InlineTokenizerContext
   */
  public resolveFallbackStates(
    states: InlineTokenizerMatchPhaseState[],
    startIndex: number,
    endIndex: number,
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    meta: Readonly<M>,
  ): InlineTokenizerMatchPhaseState[] {
    if (this.fallbackTokenizer == null) return states

    const results: InlineTokenizerMatchPhaseState[] = []

    let i = startIndex
    for (const state of states) {
      if (i < state.startIndex) {
        const fallbackState = this.fallbackTokenizer
          .findAndHandleDelimiter(i, state.startIndex, nodePoints, meta)
        results.push(fallbackState)
      }
      results.push(state)
      i = state.endIndex
    }

    if (i < endIndex) {
      const fallbackState = this.fallbackTokenizer
        .findAndHandleDelimiter(i, endIndex, nodePoints, meta)
      results.push(fallbackState)
    }

    return results
  }

  /**
   * Create immutable BlockTokenizerContext getter
   */
  protected createImmutableContext(): (() => ImmutableInlineTokenizerContext<M>) {
    const context: ImmutableInlineTokenizerContext<M> = Object.freeze({
      match: this.match.bind(this),
      postMatch: this.postMatch.bind(this),
      parse: this.parse.bind(this),
      resolveFallbackStates: this.resolveFallbackStates.bind(this),
    })

    // Return a new shallow copy each time to prevent accidental modification
    return () => context
  }
}


type MatchPhaseHook = {
  name: string
  priority: InlineTokenizer['priority']
  findDelimiter: (
    startIndex: number,
    precedingNodePoint: Readonly<EnhancedYastNodePoint> | null,
  ) => InlineTokenDelimiter | null
  processDelimiter: (
    openerDelimiter: InlineTokenDelimiter,
    closerDelimiter: InlineTokenDelimiter,
    getInnerStates: () => InlineTokenizerMatchPhaseState[],
  ) => ResultOfProcessDelimiter
  processFullDelimiter: (
    fullDelimiter: InlineTokenDelimiter
  ) => InlineTokenizerMatchPhaseState | null
}


type DelimiterItem = {
  hook: MatchPhaseHook
  delimiter: InlineTokenDelimiter
}


/**
 * Create a delimiter processor.
 *
 * @param states
 */
function createDelimiterProcessor(states: ReadonlyArray<InlineTokenizerMatchPhaseState>): {
  process: (hook: MatchPhaseHook, delimiter: InlineTokenDelimiter) => void
  collect: () => InlineTokenizerMatchPhaseState[]
} {
  const statesStack: InlineTokenizerMatchPhaseState[] = [...states]
  const delimiterStack: DelimiterItem[] = []
  const preferDelimiterIndexStack: number[] = []

  /**
   * Return the top prefer delimiter item.
   */
  const top = (): DelimiterItem | null => {
    if (preferDelimiterIndexStack.length <= 0) return null
    const index = preferDelimiterIndexStack[preferDelimiterIndexStack.length - 1]
    return delimiterStack[index]
  }

  /**
   * Push delimiter into delimiterStack.
   *
   * @param hook
   * @param delimiter
   */
  const push = (
    hook: MatchPhaseHook,
    delimiter: InlineTokenDelimiter,
  ): void => {
    switch (delimiter.type) {
      case 'opener':
      case 'both': {
        const currentDelimiterIndex = delimiterStack.length
        delimiterStack.push({ hook, delimiter })

        const topDelimiterItem = top()
        if (
          topDelimiterItem == null ||
          hook.priority > topDelimiterItem.hook.priority
        ) {
          preferDelimiterIndexStack.push(currentDelimiterIndex)
        }
        break
      }
      case 'closer': {
        if (preferDelimiterIndexStack.length > 0) {
          delimiterStack.push({ hook, delimiter })
        }
        break
      }
      case 'full': {
        const topDelimiterItem = top()
        if (
          topDelimiterItem == null ||
          hook.priority > topDelimiterItem.hook.priority
        ) {
          const state = hook.processFullDelimiter(delimiter)
          if (state != null) statesStack.push(state)
        } else {
          delimiterStack.push({ hook, delimiter })
        }
        break
      }
      default:
        throw new TypeError(
          `Unexpected delimiter type(${ delimiter.type }) from ${ hook.name }.`)
    }
  }

  /**
   * Pop a delimiter from preferDelimiterStack if it matched the given hook,
   * then convert the middle delimiters into an array of
   * InlineTokenizerMatchPhaseState and remove these delimiters from delimiterStack.
   *
   * @param hook
   * @param closerDelimiter
   */
  const resolveDelimiterPair = (
    hook: MatchPhaseHook,
    closerDelimiter: InlineTokenDelimiter
  ): InlineTokenDelimiter | null => {
    const topDelimiterItem = top()
    if (
      topDelimiterItem == null ||
      topDelimiterItem.hook !== hook
    ) return closerDelimiter

    const openerDelimiter = topDelimiterItem.delimiter

    /**
     * If the top delimiter matched the give closer delimiter, then no matter
     * what the result of the next step is, all nodes in the middle will be
     * popped up, and these popped nodes will be passed as the first parameter
     * into the `processDelimiterStack()`.
     */
    const topPreferIndex = preferDelimiterIndexStack[preferDelimiterIndexStack.length - 1]
    const innerDelimiterItems: DelimiterItem[] = delimiterStack.splice(topPreferIndex)

    // So does the states stack.
    let topStateIndex = statesStack.length - 1
    for (; topStateIndex >= 0; --topStateIndex) {
      const currentState = statesStack[topStateIndex]
      if (currentState.endIndex <= openerDelimiter.startIndex) break
    }

    let innerStates: InlineTokenizerMatchPhaseState[] = statesStack.splice(topStateIndex + 1)
    let getInnerStates: () => InlineTokenizerMatchPhaseState[] = () => innerStates
    if (innerDelimiterItems.length > 0) {
      let called = false
      getInnerStates = () => {
        if (called) return innerStates
        called = true
        const subProcessor = createDelimiterProcessor(innerStates)
        innerDelimiterItems.forEach(item => subProcessor.process(item.hook, item.delimiter))
        innerStates = subProcessor.collect()
        return innerStates
      }
    }

    const processDelimiterResult = hook
      .processDelimiter(openerDelimiter, closerDelimiter, getInnerStates)
    if (processDelimiterResult == null) {
      // Push back the popped nodes if the top delimiter is not really
      // matched with the give `closerDelimiter`.
      delimiterStack.push(...innerDelimiterItems)
      return closerDelimiter
    }

    const {
      state,
      remainOpenerDelimiter,
      remainCloserDelimiter,
    } = processDelimiterResult

    // If the openerDelimiter is not used up,
    // then push the remaining contents to the stack.
    if (remainOpenerDelimiter != null) {
      push(hook, remainCloserDelimiter!)
    }

    // If the closerDelimiter is not used up, then recursively processing.
    if (remainCloserDelimiter != null) {
      return resolveDelimiterPair(hook, remainCloserDelimiter)
    }

    statesStack.push(state)

    // Nothing remained.
    return null
  }

  /**
   * Consume delimiter item.
   *
   * @param delimiterItem
   */
  const process = (
    hook: MatchPhaseHook,
    delimiter: InlineTokenDelimiter,
  ): void => {
    switch (delimiter.type) {
      case 'opener': {
        push(hook, delimiter)
        break
      }
      case 'both':
      case 'closer': {
        const remainDelimiter = resolveDelimiterPair(hook, delimiter)
        if (remainDelimiter != null) {
          push(hook, remainDelimiter)
        }
        break
      }
      case 'full': {
        push(hook, delimiter)
        break
      }
    }
  }

  const collect = (): InlineTokenizerMatchPhaseState[] => {
    if (delimiterStack.length <= 0) return statesStack

    // Pop up if the top node's type is `opener`.
    while (
      delimiterStack.length > 0 &&
      delimiterStack[delimiterStack.length - 1].delimiter.type === 'opener'
    ) {
      delimiterStack.pop()
    }

    return statesStack
  }
  return { process, collect }
}
