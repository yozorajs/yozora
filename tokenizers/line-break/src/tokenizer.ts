import type {
  EnhancedYastNodePoint,
  YastMeta as M,
} from '@yozora/tokenizercore'
import type {
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerParsePhaseHook,
  ResultOfFindDelimiters,
  ResultOfProcessFullDelimiter,
} from '@yozora/tokenizercore-inline'
import type {
  LineBreak as PS,
  LineBreakMatchPhaseState as MS,
  LineBreakTokenDelimiter as TD,
  LineBreakType as T,
} from './types'
import { AsciiCodePoint } from '@yozora/character'
import { BaseInlineTokenizer } from '@yozora/tokenizercore-inline'
import { LineBreakTokenMarkerType, LineBreakType } from './types'


/**
 * Params for constructing LineBreakTokenizer
 */
export interface LineBreakTokenizerProps {
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
 * Lexical Analyzer for PS
 */
export class LineBreakTokenizer extends BaseInlineTokenizer implements
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook<T, M, MS, TD>,
  InlineTokenizerParsePhaseHook<T, M, MS, PS>
{
  public readonly name = 'LineBreakTokenizer'
  public readonly delimiterGroup: string = 'LineBreakTokenizer'
  public readonly recognizedTypes: T[] = [LineBreakType]
  public readonly delimiterPriority: number = -1

  public constructor(props: LineBreakTokenizerProps = {}) {
    super()
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
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  ): ResultOfFindDelimiters<TD> {
    for (let i = startIndex + 1; i < endIndex; ++i) {
      if (nodePoints[i].codePoint !== AsciiCodePoint.LF) continue

      const p = nodePoints[i - 1]
      let _start: number | null = null
      let markerType: LineBreakTokenMarkerType | null = null
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
            markerType = LineBreakTokenMarkerType.BACKSLASH
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
            markerType = LineBreakTokenMarkerType.MORE_THAN_TWO_SPACES
          }
          break
        }
      }

      if (_start == null || markerType == null) continue

      const _end = i
      const delimiter: TD = {
        type: 'full',
        markerType,
        startIndex: _start,
        endIndex: _end,
      }
      return delimiter
    }
    return null
  }

  /**
   * @override
   * @see InlineTokenizerMatchPhaseHook
   */
  public processFullDelimiter(
    fullDelimiter: TD,
  ): ResultOfProcessFullDelimiter<T, MS> {
    const state: MS = {
      type: LineBreakType,
      startIndex: fullDelimiter.startIndex,
      endIndex: fullDelimiter.endIndex,
    }
    return state
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
