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
  ResultOfEatPotentialTokens,
  ResultOfFindDelimiters,
} from '@yozora/tokenizercore-inline'
import type {
  LineBreak as PS,
  LineBreakMatchPhaseState as MS,
  LineBreakTokenDelimiter as TD,
  LineBreakType as T,
} from './types'
import { AsciiCodePoint } from '@yozora/character'
import { BaseInlineTokenizer } from '@yozora/tokenizercore-inline'
import { LineBreakTokenDelimiterType, LineBreakType } from './types'


type PT = InlinePotentialToken<T>


/**
 * Lexical Analyzer for PS
 */
export class LineBreakTokenizer extends BaseInlineTokenizer<T> implements
  InlineTokenizer<T>,
  InlineTokenizerMatchPhaseHook<T, M, MS, TD>,
  InlineTokenizerParsePhaseHook<T, M, MS, PS>
{
  public readonly name = 'LineBreakTokenizer'
  public readonly uniqueTypes: T[] = [LineBreakType]

  public constructor(props: InlineTokenizerProps) {
    super({ ...props })
  }

  /**
   * @override
   * @see InlineTokenizerMatchPhaseHook
   */
  public * eatDelimiters(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  ): ResultOfFindDelimiters<TD> {
    const delimiters: TD[] = []
    while (true) {
      const nextParams = yield
      if (nextParams == null) break

      const { startIndex, endIndex } = nextParams
      for (let i = startIndex + 1; i < endIndex; ++i) {
        if (nodePoints[i].codePoint !== AsciiCodePoint.LF) continue

        const p = nodePoints[i - 1]
        let _start: number | null = null
        let type: LineBreakTokenDelimiterType | null = null
        switch (p.codePoint) {
          /**
           * For a more visible alternative, a backslash
           * before the line ending may be used instead of two spaces
           * @see https://github.github.com/gfm/#example-655
           */
          case AsciiCodePoint.BACKSLASH: {
            let x = i - 2
            for (; x >= startIndex; x -= 1) {
              if (nodePoints[x].codePoint !== AsciiCodePoint.BACKSLASH) break
            }
            if (((i - x) & 1) === 0) {
              _start = i - 1
              type = LineBreakTokenDelimiterType.BACKSLASH
            }
            break
          }
          /**
           * - A line break (not in a code span or HTML tag) that is preceded
           *   by two or more spaces and does not occur at the end of a block
           *   is parsed as a hard line break (rendered in HTML as a <br /> tag)
           * - More than two spaces can be used
           * - Leading spaces at the beginning of the next line are ignored
           *
           * @see https://github.github.com/gfm/#example-654
           * @see https://github.github.com/gfm/#example-656
           * @see https://github.github.com/gfm/#example-657
           */
          case AsciiCodePoint.SPACE: {
            let x = i - 2
            for (; x >= startIndex; x -= 1) {
              if (nodePoints[x].codePoint !== AsciiCodePoint.SPACE) break
            }

            if (i - x > 2) {
              _start = x + 1
              type = LineBreakTokenDelimiterType.MORE_THAN_TWO_SPACES
            }
            break
          }
        }

        if (_start == null || type == null) continue

        const _end = i
        const delimiter: TD = {
          type,
          startIndex: _start,
          endIndex: _end,
        }
        delimiters.push(delimiter)
      }
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
      const state: MS = { type: LineBreakType }
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
  public parse(): PS {
    const result: PS = { type: LineBreakType }
    return result
  }
}
