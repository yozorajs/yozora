import type { YastNodeType } from '@yozora/tokenizercore'
import type {
  ResultOfEatContinuationText,
  ResultOfEatLazyContinuationText,
  ResultOfEatOpener,
} from '../types/lifecycle/match-block'
import type { ResultOfParse } from '../types/lifecycle/parse-block'
import type {
  BlockTokenizer,
  FallbackBlockTokenizer,
} from '../types/tokenizer'
import type {
  PhrasingContent as Node,
  PhrasingContentLine,
  PhrasingContentState as State,
  PhrasingContentType as T,
} from './types'
import { PhrasingContentType } from './types'
import {
  buildPhrasingContent,
  buildPhrasingContentState,
  calcPositionFromPhrasingContentLines,
} from './util'


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
  implements FallbackBlockTokenizer<T, State, Node> {
  public readonly name: string = PhrasingContentTokenizer.name
  public readonly getContext: BlockTokenizer['getContext'] = () => null

  public readonly isContainerBlock = false
  public readonly interruptableTypes: ReadonlyArray<YastNodeType>
  public readonly recognizedTypes: ReadonlyArray<T> = [PhrasingContentType]

  /* istanbul ignore next */
  public constructor(props: PhrasingContentTokenizerProps = {}) {
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
  public parse(state: Readonly<State>): ResultOfParse<T, Node> {
    const node: Node | null = buildPhrasingContent(state)
    if (node == null) return null
    return { classification: 'flow', node }
  }

  /**
   * @override
   * @see BlockTokenizer
   */
  public extractPhrasingContentLines(
    state: Readonly<State>,
  ): ReadonlyArray<PhrasingContentLine> {
    return state.lines
  }

  /**
   * @override
   * @see BlockTokenizer
   */
  public readonly buildBlockState = buildPhrasingContentState
}
