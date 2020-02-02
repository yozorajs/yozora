import {
  CodePoint,
  InlineDataNodeType,
  DataNodeTokenPosition,
  DataNodeTokenPoint,
  DataNodeTokenFlankingGraph,
  buildGraphFromSingleFlanking,
} from '@yozora/core'
import { InlineDataNodeTokenizer } from '../types'
import { BaseInlineDataNodeTokenizer } from './_base'


const T = InlineDataNodeType.TEXT
type T = typeof T


/**
 * Lexical Analyzer for TextDataNode
 */
export class TextTokenizer
  extends BaseInlineDataNodeTokenizer<T>
  implements InlineDataNodeTokenizer<T> {
  public readonly type = T

  /**
   * 总是返回整个范围区间就够了，因为对于所有的其它分词器都不匹配的块，
   * 此分词器能匹配，此时失去了竞争对手，就能获得解析权了
   *
   * It is enough to always return the entire range interval,
   * because for all the blocks that other tokenizers do not match,
   * this tokenizer can match, and at this time,
   * because of losing the competitor, it can obtain the parsing right.
   */
  public match(content: string, codePoints: number[]): DataNodeTokenFlankingGraph<T> {
    const self = this
    self.initBeforeMatch(content, codePoints)

    let offset = 0, line = 1, column = 1
    for (; offset < codePoints.length; ++offset, ++column) {
      const c = codePoints[offset]
      switch (c) {
        case CodePoint.LINE_FEED:
          ++line, column = 0
          break
      }
    }
    const start: DataNodeTokenPoint = { offset: 0, line: 1, column: 1 }
    const end: DataNodeTokenPoint = { offset, line, column }
    const position: DataNodeTokenPosition = { start, end }
    const flanking: DataNodeTokenPosition[] = [position]
    const result = buildGraphFromSingleFlanking(self.type, flanking)
    return result
  }
}
