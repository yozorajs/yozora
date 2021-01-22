import type {
  EnhancedYastNodePoint,
  YastMeta as M,
} from '@yozora/tokenizercore'
import type {
  InlinePotentialToken,
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerParsePhaseHook,
  InlineTokenizerProps,
  ResultOfEatDelimiters,
  ResultOfEatPotentialTokens,
} from '@yozora/tokenizercore-inline'
import type {
  Text as PS,
  TextMatchPhaseState as MS,
  TextTokenDelimiter as TD,
  TextType as T,
} from './types'
import { calcStringFromNodePointsIgnoreEscapes } from '@yozora/tokenizercore'
import { BaseInlineTokenizer } from '@yozora/tokenizercore-inline'
import { TextType } from './types'


type PT = InlinePotentialToken<T>


/**
 * Lexical Analyzer for Text
 */
export class TextTokenizer extends BaseInlineTokenizer<T> implements
  InlineTokenizer<T>,
  InlineTokenizerMatchPhaseHook<T, M, MS, TD>,
  InlineTokenizerParsePhaseHook<T, M, MS, PS>
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
  public * eatDelimiters(): ResultOfEatDelimiters<TD> {
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
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    meta: Readonly<M>,
    delimiters: TD[],
  ): ResultOfEatPotentialTokens<T> {
    const results: PT[] = []
    for (const delimiter of delimiters) {
      const state: MS = {
        type: TextType ,
        startIndex: delimiter.startIndex,
        endIndex: delimiter.endIndex,
      }
      results.push({
        state,
        startIndex: delimiter.startIndex,
        endIndex: delimiter.endIndex,
      })
    }
    return results
  }

  /**
   * @override
   * @see InlineTokenizerParsePhaseHook
   */
  public parse(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    meta: Readonly<M>,
    matchPhaseState: MS,
  ): PS {
    const { startIndex, endIndex } = matchPhaseState
    let value: string =
      calcStringFromNodePointsIgnoreEscapes(nodePoints, startIndex, endIndex)

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
