import { CharCode, InlineDataNodeType, DataNodeTokenPosition, DataNodeTokenPoint } from '@yozora/core'
import { InlineDataNodeTokenizer } from '../types'
import { BaseInlineDataNodeTokenizer } from './_base'


/**
 * Lexical Analyzer for TextDataNode
 */
export class TextTokenizer
  extends BaseInlineDataNodeTokenizer<InlineDataNodeType.TEXT>
  implements InlineDataNodeTokenizer<InlineDataNodeType.TEXT> {
  public readonly type = InlineDataNodeType.TEXT

  public match(content: string): DataNodeTokenPosition[] {
    let offset = 0, line = 1, column = 1
    for (; offset < content.length; ++offset, ++column) {
      const c = content.charCodeAt(offset)
      switch (c) {
        case CharCode.LINE_FEED:
          ++line, column = 0
          break
      }
    }
    const start: DataNodeTokenPoint = { offset: 0, line: 1, column: 1 }
    const end: DataNodeTokenPoint = { offset, line, column }
    const result: DataNodeTokenPosition = { start, end }
    return [result]
  }
}
