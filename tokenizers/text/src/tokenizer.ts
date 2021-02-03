import type {
  EnhancedYastNodePoint,
  YastMeta as M,
} from '@yozora/tokenizercore'
import type {
  FallbackInlineTokenizer,
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerParsePhaseHook,
  ResultOfFindDelimiters,
  YastInlineNode,
} from '@yozora/tokenizercore-inline'
import type {
  Text as PS,
  TextMatchPhaseState as MS,
  TextTokenDelimiter as TD,
  TextType as T,
} from './types'
import { calcStringFromNodePointsIgnoreEscapes } from '@yozora/tokenizercore'
import { TextType } from './types'


/**
 * Params for constructing TextTokenizer
 */
export interface TextTokenizerProps {
  /**
   * Delimiter group identity.
   */
  readonly delimiterGroup?: string
  /**
   * Delimiter priority.
   */
  readonly delimiterPriority?: number
}


/**
 * Lexical Analyzer for Text
 */
export class TextTokenizer implements
  InlineTokenizer,
  FallbackInlineTokenizer<T, M, MS, PS>,
  InlineTokenizerMatchPhaseHook<T, M, MS, TD>,
  InlineTokenizerParsePhaseHook<T, M, MS, PS>
{
  public readonly name = 'TextTokenizer'
  public readonly getContext: InlineTokenizer['getContext'] = () => null

  public readonly delimiterGroup: string = 'TextTokenizer'
  public readonly recognizedTypes: T[] = [TextType]
  public readonly delimiterPriority: number = Number.MAX_SAFE_INTEGER

  public constructor(props: TextTokenizerProps = {}) {
    if (props.delimiterPriority != null) {
      this.delimiterPriority = props.delimiterPriority
    }
    if (props.delimiterGroup != null) {
      this.delimiterGroup = props.delimiterGroup
    }
  }

  /**
   * @override
   * @see InlineTokenizerMatchPhaseHook
   */
  public findDelimiter(
    startIndex: number,
    endIndex: number,
  ): ResultOfFindDelimiters<TD> {
    const delimiter: TD = {
      type: 'full',
      startIndex,
      endIndex,
    }
    return delimiter
  }

  /**
   * @override
   * @see InlineTokenizerMatchPhaseHook
   */
  public processFullDelimiter(fullDelimiter: TD): MS | null {
    const state: MS = {
      type: TextType,
      startIndex: fullDelimiter.startIndex,
      endIndex: fullDelimiter.endIndex,
    }
    return state
  }

  /**
   * @override
   * @see FallbackInlineTokenizer
   */
  public findAndHandleDelimiter(startIndex: number, endIndex: number): MS {
    const state: MS = {
      type: TextType,
      startIndex,
      endIndex,
    }
    return state
  }

  /**
   * @override
   * @see InlineTokenizerParsePhaseHook
   */
  public parse(
    matchPhaseState: MS,
    children: YastInlineNode[] | undefined,
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  ): PS {
    const { startIndex, endIndex } = matchPhaseState
    let value: string = calcStringFromNodePointsIgnoreEscapes(
      nodePoints, startIndex, endIndex)

    /**
     * Spaces at the end of the line and beginning of the next line are removed
     * @see https://github.github.com/gfm/#example-670
     */
    value = value.replace(/[^\S\n]*\n[^\S\n]*/g, '\n')
    const result: PS = {
      type: TextType,
      value,
    }
    return result
  }
}
