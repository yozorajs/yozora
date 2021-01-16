import type {
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerParsePhaseHook,
  InlineTokenizerProps,
  NextParamsOfEatDelimiters,
  RawContent,
} from '@yozora/tokenizercore-inline'
import type {
  LineBreak,
  LineBreakMatchPhaseState,
  LineBreakPotentialToken,
  LineBreakTokenDelimiter,
  LineBreakType as T,
} from './types'
import { AsciiCodePoint } from '@yozora/character'
import { BaseInlineTokenizer } from '@yozora/tokenizercore-inline'
import { LineBreakTokenDelimiterType, LineBreakType } from './types'


/**
 * Lexical Analyzer for LineBreak
 */
export class LineBreakTokenizer extends BaseInlineTokenizer<T>
  implements
    InlineTokenizer<T>,
    InlineTokenizerMatchPhaseHook<
      T,
      LineBreakMatchPhaseState,
      LineBreakTokenDelimiter,
      LineBreakPotentialToken>,
    InlineTokenizerParsePhaseHook<
      T,
      LineBreakMatchPhaseState,
      LineBreak>
{
  public readonly name = 'LineBreakTokenizer'
  public readonly uniqueTypes: T[] = [LineBreakType]

  public constructor(props: InlineTokenizerProps) {
    super({ ...props })
  }

  /**
   * hook of @InlineTokenizerPreMatchPhaseHook
   */
  public * eatDelimiters(
    rawContent: RawContent,
  ): Iterator<void, LineBreakTokenDelimiter[], NextParamsOfEatDelimiters | null> {
    const { nodePoints } = rawContent
    const delimiters: LineBreakTokenDelimiter[] = []
    while (true) {
      const nextParams = yield
      if (nextParams == null) break

      const { startIndex, endIndex } = nextParams
      for (let i = startIndex + 1; i < endIndex; ++i) {
        if (nodePoints[i].codePoint !== AsciiCodePoint.LINE_FEED) continue

        const p = nodePoints[i - 1]
        let _start: number | null = null
        let type: LineBreakTokenDelimiterType | null = null
        switch (p.codePoint) {
          /**
           * For a more visible alternative, a backslash
           * before the line ending may be used instead of two spaces
           * @see https://github.github.com/gfm/#example-655
           */
          case AsciiCodePoint.BACK_SLASH: {
            let x = i - 2
            for (; x >= startIndex; x -= 1) {
              if (nodePoints[x].codePoint !== AsciiCodePoint.BACK_SLASH) break
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
        const delimiter: LineBreakTokenDelimiter = {
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
   * hook of @InlineTokenizerPreMatchPhaseHook
   */
  public eatPotentialTokens(
    rawContent: RawContent,
    delimiters: LineBreakTokenDelimiter[],
  ): LineBreakPotentialToken[] {
    const potentialTokens: LineBreakPotentialToken[] = []
    for (const delimiter of delimiters) {
      const potentialToken: LineBreakPotentialToken = {
        type: LineBreakType,
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
    potentialToken: LineBreakPotentialToken,
  ): LineBreakMatchPhaseState | null {
    const result: LineBreakMatchPhaseState = {
      type: LineBreakType,
      startIndex: potentialToken.startIndex,
      endIndex: potentialToken.endIndex,
    }
    return result
  }

  /**
   * hook of @InlineTokenizerParsePhaseHook
   */
  public parse(): LineBreak {
    const result: LineBreak = {
      type: LineBreakType,
    }
    return result
  }
}
