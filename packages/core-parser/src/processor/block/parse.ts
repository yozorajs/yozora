import type { Node } from '@yozora/ast'
import type {
  IBlockToken,
  IParseBlockGenerator,
  IParseBlockHook,
  IParseBlockTokensRequest,
} from '@yozora/core-tokenizer'
import { invariant } from '@yozora/invariant'

/** Explicit replacement for one recursive block-token parse call. */
interface IParseBlockFrame {
  readonly parsedNodes: Node[]
  readonly tokens: readonly IBlockToken[]
  /** Active generator for the current batch; null means the frame can advance. */
  hookExecution: IParseBlockHookExecution | null
  nextTokenIndex: number
}

/** Generator suspended while the current frame parses one tokenizer batch. */
interface IParseBlockHookExecution {
  readonly generator: IParseBlockGenerator<Node[]>
  state: IParseBlockGeneratorState
}

/** Identifies how the scheduler should advance or resume a generator hook. */
enum GeneratorStateType {
  /** The generator has been created but has not been advanced yet. */
  Initial = 'initial',
  /** The generator cannot resume until its requested child frame settles. */
  WaitingForChild = 'waitingForChild',
  /** Child parsing succeeded and the resulting nodes must be sent back. */
  ResumeWithNodes = 'resumeWithNodes',
  /** Child parsing failed and the error must be thrown back into the generator. */
  ResumeWithError = 'resumeWithError',
}

/** Payload produced when a child frame settles. */
type IParseBlockGeneratorResume =
  | { readonly type: GeneratorStateType.ResumeWithNodes; readonly nodes: Node[] }
  | { readonly type: GeneratorStateType.ResumeWithError; readonly error: unknown }

/** Complete lifecycle state of a generator hook owned by one frame. */
type IParseBlockGeneratorState =
  | { readonly type: GeneratorStateType.Initial }
  | { readonly type: GeneratorStateType.WaitingForChild }
  | IParseBlockGeneratorResume

/**
 * Parse block tokens without growing the JavaScript call stack.
 *
 * Synchronous hooks complete immediately. Generator hooks suspend on child
 * requests so the scheduler can resolve them on its explicit frame stack and
 * then resume the hook with either the child nodes or the thrown error.
 */
export function parseBlockTokens(
  tokens: readonly IBlockToken[] | undefined,
  hookMap: ReadonlyMap<string, IParseBlockHook>,
): Node[] {
  if (tokens === undefined || tokens.length <= 0) return []
  return new ParseBlockScheduler(hookMap).parse(tokens)
}

/**
 * Replace recursive block parsing with an explicit stack. Each frame owns one
 * token list and, while a tokenizer batch is suspended, one generator.
 */
class ParseBlockScheduler {
  private readonly frameStack: IParseBlockFrame[] = []
  private readonly activeTokenSet = new Set<IBlockToken>()

  /** Keep all mutable scheduling state isolated to one parse invocation. */
  public constructor(private readonly hookMap: ReadonlyMap<string, IParseBlockHook>) {}

  /** Drive the top frame until the root frame produces nodes or throws. */
  public parse(tokens: readonly IBlockToken[]): Node[] {
    this.frameStack.push(this.createFrame(tokens))
    while (this.frameStack.length > 0) {
      const currentFrame = this.frameStack[this.frameStack.length - 1]
      if (currentFrame.hookExecution !== null) {
        this.stepHookExecution(currentFrame)
        continue
      }

      const rootNodes = this.stepTokenListFrame(currentFrame)
      if (rootNodes !== null) return rootNodes
    }

    throw new Error('[parseBlock] scheduler stopped without a result')
  }

  /**
   * Register every token before exposing a frame to the scheduler, rolling back
   * partial registration so cycle detection remains correct after failure.
   */
  private createFrame(tokens: readonly IBlockToken[]): IParseBlockFrame {
    const registeredTokens: IBlockToken[] = []
    try {
      for (const token of tokens) {
        invariant(
          !this.activeTokenSet.has(token),
          `[parseBlock] cyclic or shared token tree at tokenizer '${token._tokenizer}'`,
        )
        this.activeTokenSet.add(token)
        registeredTokens.push(token)
      }
    } catch (error) {
      for (const token of registeredTokens) this.activeTokenSet.delete(token)
      throw error
    }

    return { hookExecution: null, nextTokenIndex: 0, parsedNodes: [], tokens }
  }

  /**
   * Give every frame one exit path that releases its tokens before delivering
   * either nodes or an error to the parent generator.
   */
  private settleFrame(frame: IParseBlockFrame, resume: IParseBlockGeneratorResume): Node[] | null {
    invariant(this.frameStack.pop() === frame, '[parseBlock] unexpected token-list frame')
    for (const token of frame.tokens) this.activeTokenSet.delete(token)

    const parentFrame = this.frameStack[this.frameStack.length - 1]
    if (parentFrame === undefined) {
      if (resume.type === GeneratorStateType.ResumeWithError) throw resume.error
      return resume.nodes
    }

    const parentHookExecution = parentFrame.hookExecution
    invariant(parentHookExecution !== null, '[parseBlock] expected active hook execution')
    invariant(
      parentHookExecution.state.type === GeneratorStateType.WaitingForChild,
      '[parseBlock] generator is not waiting for a child',
    )
    parentHookExecution.state = resume
    return null
  }

  /**
   * Advance exactly one tokenizer batch so the scheduler regains control before
   * processing a suspended hook or the next batch.
   */
  private stepTokenListFrame(frame: IParseBlockFrame): Node[] | null {
    if (frame.nextTokenIndex >= frame.tokens.length) {
      return this.settleFrame(frame, {
        type: GeneratorStateType.ResumeWithNodes,
        nodes: frame.parsedNodes,
      })
    }

    const batchStartIndex = frame.nextTokenIndex
    const tokenizerName: string = frame.tokens[batchStartIndex]._tokenizer
    let batchEndIndex = batchStartIndex + 1
    while (
      batchEndIndex < frame.tokens.length &&
      frame.tokens[batchEndIndex]._tokenizer === tokenizerName
    ) {
      batchEndIndex += 1
    }
    frame.nextTokenIndex = batchEndIndex

    try {
      const hook = this.hookMap.get(tokenizerName)
      invariant(hook !== undefined, `[parseBlock] tokenizer '${tokenizerName}' not found`)

      const tokenBatch = frame.tokens.slice(batchStartIndex, batchEndIndex)
      const hookResult = hook.parse(tokenBatch)
      if (Array.isArray(hookResult)) {
        for (const node of hookResult) frame.parsedNodes.push(node)
        return null
      }

      invariant(
        hookResult != null &&
          typeof hookResult.next === 'function' &&
          typeof hookResult.throw === 'function' &&
          typeof hookResult[Symbol.iterator] === 'function',
        `[parseBlock] tokenizer '${tokenizerName}' returned an invalid result`,
      )
      frame.hookExecution = {
        generator: hookResult,
        state: { type: GeneratorStateType.Initial },
      }
    } catch (error) {
      this.settleFrame(frame, { type: GeneratorStateType.ResumeWithError, error })
    }
    return null
  }

  /**
   * Advance a suspended hook once, then keep its completion, child request, and
   * failure handling together so the generator state machine reads linearly.
   */
  private stepHookExecution(frame: IParseBlockFrame): void {
    const hookExecution = frame.hookExecution
    invariant(hookExecution !== null, '[parseBlock] expected active hook execution')

    let iteratorResult: IteratorYieldResult<IParseBlockTokensRequest>
    try {
      const state = hookExecution.state
      invariant(
        state.type !== GeneratorStateType.WaitingForChild,
        '[parseBlock] generator resumed without a child result',
      )
      let result: IteratorResult<IParseBlockTokensRequest, Node[]>
      if (state.type === GeneratorStateType.Initial) {
        result = hookExecution.generator.next()
      } else if (state.type === GeneratorStateType.ResumeWithNodes) {
        result = hookExecution.generator.next(state.nodes)
      } else {
        result = hookExecution.generator.throw(state.error)
      }
      invariant(
        result !== null && typeof result === 'object' && 'value' in result,
        '[parseBlock] generator returned an invalid iterator result',
      )
      if (result.done) {
        if (!Array.isArray(result.value)) {
          throw new TypeError('[parseBlock] generator returned invalid nodes')
        }
        for (const node of result.value) frame.parsedNodes.push(node)
        frame.hookExecution = null
        return
      }

      iteratorResult = result
    } catch (error) {
      this.settleFrame(frame, { type: GeneratorStateType.ResumeWithError, error })
      return
    }

    try {
      const request: IParseBlockTokensRequest = iteratorResult.value
      invariant(request?.type === 'blockTokens', '[parseBlock] unexpected generator request')

      if (request.tokens === undefined || request.tokens.length <= 0) {
        hookExecution.state = { type: GeneratorStateType.ResumeWithNodes, nodes: [] }
      } else {
        hookExecution.state = { type: GeneratorStateType.WaitingForChild }
        this.frameStack.push(this.createFrame(request.tokens))
      }
    } catch (error) {
      hookExecution.state = { type: GeneratorStateType.ResumeWithError, error }
    }
  }
}
