import { AsciiCodePoint } from '@yozora/character'
import { DataNodeTokenPointDetail } from '@yozora/tokenizercore'
import {
  BaseInlineTokenizer,
  InlinePotentialTokenItem,
  InlineTokenDelimiterItem,
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerParsePhaseHook,
  InlineTokenizerPreMatchPhaseHook,
} from '@yozora/tokenizercore-inline'
import {
  LineBreakDataNode,
  LineBreakDataNodeType,
  LineBreakMatchPhaseState,
  LineBreakPreMatchPhaseState,
} from './types'


type T = LineBreakDataNodeType


/**
 * Lexical Analyzer for LineBreakDataNode
 */
export class LineBreakTokenizer extends BaseInlineTokenizer<T>
  implements
    InlineTokenizer<T>,
    InlineTokenizerPreMatchPhaseHook<
      T,
      LineBreakPreMatchPhaseState>,
    InlineTokenizerMatchPhaseHook<
      T,
      LineBreakPreMatchPhaseState,
      LineBreakMatchPhaseState>,
    InlineTokenizerParsePhaseHook<
      T,
      LineBreakMatchPhaseState,
      LineBreakDataNode>
{
  public readonly name = 'LineBreakTokenizer'
  public readonly uniqueTypes: T[] = [LineBreakDataNodeType]


  /**
   * hook of @InlineTokenizerPreMatchPhaseHook
   */
  public eatDelimiters(
    codePositions: DataNodeTokenPointDetail[],
    startIndex: number,
    endIndex: number,
    delimiters: InlineTokenDelimiterItem[],
  ): void {
    for (let i = startIndex + 1; i < endIndex; ++i) {
      if (codePositions[i].codePoint !== AsciiCodePoint.LINE_FEED) continue

      const p = codePositions[i - 1]
      let _start: number | null = null
      switch (p.codePoint) {
        /**
         * For a more visible alternative, a backslash
         * before the line ending may be used instead of two spaces
         * @see https://github.github.com/gfm/#example-655
         */
        case AsciiCodePoint.BACK_SLASH: {
          let x = i - 2
          for (; x >= startIndex; x -= 1) {
            if (codePositions[x].codePoint !== AsciiCodePoint.BACK_SLASH) break
          }
          if (((i - x) & 1) === 0) {
            _start = i - 1
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
            if (codePositions[x].codePoint !== AsciiCodePoint.SPACE) break
          }

          if (i - x > 2) {
            _start = x + 1
          }
          break
        }
      }

      if (_start == null) continue

      /**
       * Leading spaces at the beginning of the next line are ignored
       * @see https://github.github.com/gfm/#example-657
       * @see https://github.github.com/gfm/#example-658
       */
      let _end = i + 1
      for (; _end < endIndex; ++_end) {
        const p = codePositions[_end]
        if (
          p.codePoint !== AsciiCodePoint.SPACE &&
          p.codePoint !== AsciiCodePoint.LINE_FEED
        ) break
      }

      const delimiter: InlineTokenDelimiterItem = {
        potentialType: 'both',
        startIndex: _start,
        endIndex: _end,
        thickness: 0,
      }
      delimiters.push(delimiter)
    }
  }

  /**
   * hook of @InlineTokenizerPreMatchPhaseHook
   */
  public eatTokens(
    codePositions: DataNodeTokenPointDetail[],
    delimiters: InlineTokenDelimiterItem[],
  ): InlinePotentialTokenItem<T>[] {
    const tokens = delimiters.map((delimiter): InlinePotentialTokenItem<T> => ({
      type: LineBreakDataNodeType,
      startIndex: delimiter.startIndex,
      endIndex: delimiter.endIndex,
    }))
    return tokens
  }

  /**
   * hook of @InlineTokenizerPreMatchPhaseHook
   */
  public assemblePreMatchState(
    codePositions: DataNodeTokenPointDetail[],
    token: InlinePotentialTokenItem<T>,
  ): LineBreakPreMatchPhaseState {
    const result: LineBreakPreMatchPhaseState = {
      type: LineBreakDataNodeType,
      startIndex: token.startIndex,
      endIndex: token.endIndex,
    }
    return result
  }

  /**
   * hook of @InlineTokenizerMatchPhaseHook
   */
  public match(
    codePositions: DataNodeTokenPointDetail[],
    preMatchPhaseState: LineBreakPreMatchPhaseState,
  ): LineBreakMatchPhaseState | false {
    const result: LineBreakMatchPhaseState = {
      type: LineBreakDataNodeType,
      startIndex: preMatchPhaseState.startIndex,
      endIndex: preMatchPhaseState.endIndex,
    }
    return result
  }

  /**
   * hook of @InlineTokenizerParsePhaseHook
   */
  public parse(): LineBreakDataNode {
    const result: LineBreakDataNode = {
      type: LineBreakDataNodeType,
    }
    return result
  }
}
