import {
  InlineDataNodeTokenizer,
  BaseInlineDataNodeTokenizer,
  DataNodeTokenPointDetail,
  DataNodeTokenPosition,
  DataNodeType,
  CodePoint,
} from '@yozora/tokenizer-core'
import { LineBreakDataNodeType, LineBreakDataNodeData } from './types'


type T = LineBreakDataNodeType


export interface LineBreakEatingState {

}


export interface LineBreakMatchedResultItem extends DataNodeTokenPosition<T> {

}


/**
 * Lexical Analyzer for LineBreakDataNode
 */
export class LineBreakTokenizer extends BaseInlineDataNodeTokenizer<
  T,
  LineBreakMatchedResultItem,
  LineBreakDataNodeData,
  LineBreakEatingState>
  implements InlineDataNodeTokenizer<T> {
  public readonly name = 'LineBreakTokenizer'
  public readonly recognizedTypes: T[] = [LineBreakDataNodeType]

  /**
   * override
   */
  protected eatTo(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    precedingTokenPosition: DataNodeTokenPosition<DataNodeType> | null,
    state: LineBreakEatingState,
    startOffset: number,
    endOffset: number,
    result: LineBreakMatchedResultItem[],
  ): void {
    if (startOffset >= endOffset) return
    for (let i = startOffset + 1; i < endOffset; ++i) {
      const p = codePoints[i]
      switch (p.codePoint) {
        case CodePoint.LINE_FEED: {
          let start: number | null = null
          switch (codePoints[i - 1].codePoint) {
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
            case CodePoint.SPACE: {
              if (i - startOffset < 2) break
              let x = i - 2
              for (; x >= startOffset && codePoints[x].codePoint === CodePoint.SPACE;) x -= 1
              if (x === i - 2) break
              start = x + 1
              break
            }
            /**
             * For a more visible alternative, a backslash
             * before the line ending may be used instead of two spaces
             * @see https://github.github.com/gfm/#example-655
             */
            case CodePoint.BACK_SLASH: {
              let x = i - 2
              for (; x >= startOffset && codePoints[x].codePoint === CodePoint.BACK_SLASH;) x -= 1
              if ((x - i) & 1) break
              start = i - 1
              break
            }
          }

          if (start == null) continue

          /**
           * Leading spaces at the beginning of the next line are ignored
           * @see https://github.github.com/gfm/#example-657
           * @see https://github.github.com/gfm/#example-658
           */
          let end = i + 1
          for (; end < endOffset; ++end) {
            const p = codePoints[end]
            if (p.codePoint !== CodePoint.SPACE && p.codePoint !== CodePoint.LINE_FEED) break
          }

          const resultItem: LineBreakMatchedResultItem = {
            type: LineBreakDataNodeType,
            left: { start, end: start, thickness: 0 },
            right: { start: end, end, thickness: 0 },
            children: [],
          }
          result.push(resultItem)
          break
        }
      }
    }
  }

  /**
   * override
   */
  protected parseData(): LineBreakDataNodeData {
    return {}
  }
}
