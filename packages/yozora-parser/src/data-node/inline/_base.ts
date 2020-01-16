import { InlineDataNodeType, DataNodeTokenPosition, DataNodeTokenPoint, CharCode } from '@yozora/core'
import { InlineDataNodeTokenizer, DataNodeTokenizerContext } from '../types'


/**
 * 内联数据的词法分析器的抽象类
 */
export abstract class BaseInlineDataNodeTokenizer<T extends InlineDataNodeType>
  implements InlineDataNodeTokenizer<T>  {
  public abstract readonly type: T
  public readonly priority: number
  protected readonly context: DataNodeTokenizerContext

  public constructor(context: DataNodeTokenizerContext, priority: number) {
    this.context = context
    this.priority = priority
  }

  public abstract match(content: string): DataNodeTokenPosition[]

  // Move forward one character and update the position of the point
  public moveForward(content: string, point: DataNodeTokenPoint): void {
    // beyond the right border, return directly
    if (point.offset >= content.length) return

    // move one character forward
    ++point.offset
    ++point.column

    // If the previous position is a newline,
    // reset the column number and add one to the line number
    if (point.offset > 1 && content.charCodeAt(point.offset - 1) === CharCode.LINE_FEED) {
      point.column = 1
      ++point.line
    }
  }

  // Move backward one character and update the position of the point
  public moveBackward(content: string, point: DataNodeTokenPoint): void {
    // beyond the left border, return directly
    if (point.offset <= 0) return

    // move one character backward
    --point.offset
    --point.column

    // If the current position is a newline (column <= 0),
    // recalculate the column number and decrement the line number by one
    if (point.column <= 0) {
      --point.line
      for (let offset = point.offset - 1; ; --offset) {
        if (content.charCodeAt(offset) === CharCode.LINE_FEED) {
          point.column = point.offset - offset
          break
        }
        if (offset <= 0) {
          point.column = point.offset
          break
        }
      }
    }
  }
}
