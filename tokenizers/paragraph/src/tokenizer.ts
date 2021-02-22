import type {
  BlockFallbackTokenizer,
  PhrasingContentLine,
  PhrasingContentState,
  ResultOfEatContinuationText,
  ResultOfEatLazyContinuationText,
  ResultOfEatOpener,
  ResultOfParse,
  Tokenizer,
  TokenizerMatchBlockHook,
  TokenizerParseBlockHook,
  YastNodeType,
} from '@yozora/tokenizercore'
import type {
  Paragraph as Node,
  ParagraphState as State,
  ParagraphType as T,
} from './types'
import {
  PhrasingContentType,
  calcPositionFromPhrasingContentLines,
  trimBlankLines,
} from '@yozora/tokenizercore'
import { ParagraphType } from './types'


/**
 * Params for constructing ParagraphTokenizer
 */
export interface ParagraphTokenizerProps {
  /**
   * Specify an array of YastNode types that can be interrupted by this
   * Tokenizer on match phase.
   */
  readonly interruptableTypes?: YastNodeType[]
}


/**
 * Lexical Analyzer for Paragraph.
 *
 * A sequence of non-blank lines that cannot be interpreted as other kinds
 * of blocks forms a paragraph. The contents of the paragraph are the result
 * of parsing the paragraph’s raw content as inlines. The paragraph’s raw
 * content is formed by concatenating the lines and removing initial and
 * final whitespace.
 *
 * @see https://github.com/syntax-tree/mdast#list
 * @see https://github.github.com/gfm/#paragraphs
 */
export class ParagraphTokenizer implements
  BlockFallbackTokenizer<T, State, Node>,
  Tokenizer,
  TokenizerMatchBlockHook<T, State>,
  TokenizerParseBlockHook<T, State, Node>
{
  public readonly name: string = ParagraphTokenizer.name
  public readonly getContext: Tokenizer['getContext'] = () => null

  public readonly isContainerBlock = false
  public readonly interruptableTypes: ReadonlyArray<YastNodeType>
  public readonly recognizedTypes: ReadonlyArray<T> = [ParagraphType]

  /* istanbul ignore next */
  public constructor(props: ParagraphTokenizerProps = {}) {
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
      type: ParagraphType,
      position,
      lines: [line],
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
    const { endIndex, firstNonWhitespaceIndex } = line

    /**
     * Paragraphs can contain multiple lines, but no blank lines
     * @see https://github.github.com/gfm/#example-190
     */
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
    // Try to build phrasingContent
    const phrasingContentState: PhrasingContentState = {
      type: PhrasingContentType,
      position: state.position,
      lines: state.lines,
    }

    const context = this.getContext()!
    const phrasingContent = context.buildPhrasingContent(phrasingContentState)
    if (phrasingContent == null) return null

    const node: Node = {
      type: ParagraphType,
      children: [phrasingContent],
    }
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
  public buildBlockState(
    _lines: ReadonlyArray<PhrasingContentLine>,
  ): State | null {
    const lines = trimBlankLines(_lines)
    if (lines == null) return null

    const position = calcPositionFromPhrasingContentLines(lines)
    const state: State = {
      type: ParagraphType,
      lines,
      position,
    }
    return state
  }
}
