import type { YastMeta as M } from '@yozora/tokenizercore'
import type {
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerParsePhaseHook,
  InlineTokenizerProps,
  NextParamsOfEatDelimiters,
  RawContent,
} from '@yozora/tokenizercore-inline'
import type {
  Text as PS,
  TextMatchPhaseState as MS,
  TextPotentialToken as PT,
  TextTokenDelimiter as TD,
  TextType as T,
} from './types'
import { calcStringFromNodePointsIgnoreEscapes } from '@yozora/tokenizercore'
import { BaseInlineTokenizer } from '@yozora/tokenizercore-inline'
import { TextType } from './types'


/**
 * Lexical Analyzer for Text
 */
export class TextTokenizer extends BaseInlineTokenizer<T> implements
  InlineTokenizer<T>,
  InlineTokenizerMatchPhaseHook<T, M, MS, TD, PT>,
  InlineTokenizerParsePhaseHook<T, MS, PS>
{
  public readonly name = 'TextTokenizer'
  public readonly uniqueTypes: T[] = [TextType]

  public constructor(props: InlineTokenizerProps) {
    super({ ...props })
  }

  /**
   * @override
   * @see InlineTokenizerMatchPhaseHook
   */
  public * eatDelimiters()
    : Iterator<void, TD[], NextParamsOfEatDelimiters | null> {
    const delimiters: TD[] = []
    while (true) {
      const nextParams = yield
      if (nextParams == null) break

      const { startIndex, endIndex } = nextParams
      const delimiter: TD = {
        type: '',
        startIndex,
        endIndex,
      }
      delimiters.push(delimiter)
    }
    return delimiters
  }

  /**
   * @override
   * @see InlineTokenizerMatchPhaseHook
   */
  public eatPotentialTokens(
    rawContent: RawContent,
    delimiters: TD[],
  ): PT[] {
    const potentialTokens: PT[] = []
    for (const delimiter of delimiters) {
      const potentialToken: PT = {
        type: TextType,
        startIndex: delimiter.startIndex,
        endIndex: delimiter.endIndex,
      }
      potentialTokens.push(potentialToken)
    }
    return potentialTokens
  }

  /**
   * @override
   * @see InlineTokenizerMatchPhaseHook
   */
  public match(
    rawContent: RawContent,
    potentialToken: PT,
  ): MS | null {
    const result: MS = {
      type: TextType,
      startIndex: potentialToken.startIndex,
      endIndex: potentialToken.endIndex,
    }
    return result
  }

  /**
   * @override
   * @see InlineTokenizerParsePhaseHook
   */
  public parse(
    rawContent: RawContent,
    matchPhaseState: MS,
  ): PS {
    const { startIndex, endIndex } = matchPhaseState
    let value: string = calcStringFromNodePointsIgnoreEscapes(
      rawContent.nodePoints, startIndex, endIndex)

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
