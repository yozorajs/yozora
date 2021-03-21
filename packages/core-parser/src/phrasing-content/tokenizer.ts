import type { YastNodeType } from '@yozora/ast'
import type {
  BlockFallbackTokenizer,
  PhrasingContent as Node,
  PhrasingContentLine,
  ResultOfEatContinuationText,
  ResultOfEatLazyContinuationText,
  ResultOfEatOpener,
  ResultOfParse,
  PhrasingContentState as State,
  PhrasingContentType as T,
  Tokenizer,
} from '@yozora/core-tokenizer'
import {
  PhrasingContentType,
  buildPhrasingContent,
  buildPhrasingContentState,
  calcPositionFromPhrasingContentLines,
} from '@yozora/core-tokenizer'

/**
 * Params for constructing PhrasingContentTokenizer
 */
export interface PhrasingContentTokenizerProps {
  /**
   * Specify an array of YastNode types that can be interrupted by this
   * Tokenizer on match phase.
   */
  readonly interruptableTypes?: YastNodeType[]
}

/**
 * Lexical Analyzer for PhrasingContent
 */
export class PhrasingContentTokenizer
  implements BlockFallbackTokenizer<T, State, Node> {
  public readonly name: string = PhrasingContentTokenizer.name
  public readonly getContext: Tokenizer['getContext'] = () => null

  public readonly isContainerBlock = false
  public readonly interruptableTypes: ReadonlyArray<YastNodeType>
  public readonly recognizedTypes: ReadonlyArray<T> = [PhrasingContentType]

  /* istanbul ignore next */
  constructor(props: PhrasingContentTokenizerProps = {}) {
    this.interruptableTypes = Array.isArray(props.interruptableTypes)
      ? [...props.interruptableTypes]
      : []
  }

  /**
   * @override
   * @see TokenizerMatchBlockHook
   */
  public eatOpener(
    line: Readonly<PhrasingContentLine>,
  ): ResultOfEatOpener<T, State> {
    const { endIndex, firstNonWhitespaceIndex } = line
    if (firstNonWhitespaceIndex >= endIndex) return null

    const lines: PhrasingContentLine[] = [{ ...line }]
    const position = calcPositionFromPhrasingContentLines(lines)
    const state: State = {
      type: PhrasingContentType,
      position,
      lines,
    }
    return { state, nextIndex: endIndex }
  }

  /**
   * @override
   * @see TokenizerMatchBlockHook
   */
  public eatContinuationText(
    line: Readonly<PhrasingContentLine>,
    state: State,
  ): ResultOfEatContinuationText {
    /**
     * PhrasingContent can contain multiple lines, but no blank lines
     */
    const { endIndex, firstNonWhitespaceIndex } = line
    if (firstNonWhitespaceIndex >= endIndex) {
      return { status: 'notMatched' }
    }

    state.lines.push({ ...line })
    return { status: 'opening', nextIndex: endIndex }
  }

  /**
   * @override
   * @see TokenizerMatchBlockHook
   */
  public eatLazyContinuationText(
    line: Readonly<PhrasingContentLine>,
    state: State,
  ): ResultOfEatLazyContinuationText {
    const result = this.eatContinuationText(line, state)
    return result as ResultOfEatLazyContinuationText
  }

  /**
   * @override
   * @see TokenizerParseBlockHook
   */
  public parseBlock(state: Readonly<State>): ResultOfParse<Node> {
    const node: Node | null = buildPhrasingContent(state)
    if (node == null) return null
    return { classification: 'flow', node }
  }

  /**
   * @override
   * @see Tokenizer
   */
  public extractPhrasingContentLines(
    state: Readonly<State>,
  ): ReadonlyArray<PhrasingContentLine> {
    return state.lines
  }

  /**
   * @override
   * @see Tokenizer
   */
  public readonly buildBlockState = buildPhrasingContentState
}
