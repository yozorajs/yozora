import type {
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerParsePhaseHook,
  InlineTokenizerProps,
  NextParamsOfEatDelimiters,
  RawContent,
} from '@yozora/tokenizercore-inline'
import type {
  Text,
  TextMatchPhaseState,
  TextPotentialToken,
  TextTokenDelimiter,
  TextType as T,
} from './types'
import { calcStringFromNodePointsIgnoreEscapes } from '@yozora/tokenizercore'
import { BaseInlineTokenizer } from '@yozora/tokenizercore-inline'
import { TextType } from './types'


/**
 * Lexical Analyzer for Text
 */
export class TextTokenizer extends BaseInlineTokenizer<T>
  implements
    InlineTokenizer<T>,
    InlineTokenizerMatchPhaseHook<
      T,
      TextMatchPhaseState,
      TextTokenDelimiter,
      TextPotentialToken>,
    InlineTokenizerParsePhaseHook<
      T,
      TextMatchPhaseState,
      Text>
{
  public readonly name = 'TextTokenizer'
  public readonly uniqueTypes: T[] = [TextType]

  public constructor(props: InlineTokenizerProps) {
    super({ ...props })
  }

  /**
   * hook of @InlineTokenizerPreMatchPhaseHook
   */
  public * eatDelimiters()
    : Iterator<void, TextTokenDelimiter[], NextParamsOfEatDelimiters | null> {
    const delimiters: TextTokenDelimiter[] = []
    while (true) {
      const nextParams = yield
      if (nextParams == null) break

      const delimiter: TextTokenDelimiter = {
        type: 'both',
        startIndex: nextParams.startIndex,
        endIndex: nextParams.endIndex,
        thickness: 0,
      }
      delimiters.push(delimiter)
    }
    return delimiters
  }

  /**
   * hook of @InlineTokenizerPreMatchPhaseHook
   */
  public eatPotentialTokens(
    rawContent: RawContent,
    delimiters: TextTokenDelimiter[],
  ): TextPotentialToken[] {
    const potentialTokens: TextPotentialToken[] = []
    for (const delimiter of delimiters) {
      const potentialToken: TextPotentialToken = {
        type: TextType,
        startIndex: delimiter.startIndex,
        endIndex: delimiter.endIndex,
      }
      potentialTokens.push(potentialToken)
    }
    return potentialTokens
  }

  /**
   * hook of @InlineTokenizerMatchPhaseHook
   */
  public match(
    rawContent: RawContent,
    potentialToken: TextPotentialToken,
  ): TextMatchPhaseState | null {
    const result: TextMatchPhaseState = {
      type: TextType,
      startIndex: potentialToken.startIndex,
      endIndex: potentialToken.endIndex,
    }
    return result
  }

  /**
   * hook of @InlineTokenizerParsePhaseHook
   */
  public parse(
    rawContent: RawContent,
    matchPhaseState: TextMatchPhaseState,
  ): Text {
    const { startIndex, endIndex } = matchPhaseState
    let value: string = calcStringFromNodePointsIgnoreEscapes(
      rawContent.nodePoints, startIndex, endIndex)

    /**
     * Spaces at the end of the line and beginning of the next line are removed
     * @see https://github.github.com/gfm/#example-670
     */
    value = value.replace(/[^\S\n]*\n[^\S\n]*/g, '\n')
    const result: Text = {
      type: TextType,
      value,
    }
    return result
  }
}
