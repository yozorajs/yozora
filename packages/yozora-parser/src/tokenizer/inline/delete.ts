import { CodePoint, InlineDataNodeType } from '@yozora/core'
import { DataNodeTokenPosition, DataNodeTokenPointDetail, DataNodeTokenFlanking } from '../../types/position'
import { DataNodeTokenizer } from '../../types/tokenizer'
import { BaseInlineDataNodeTokenizer } from './_base'


type T = InlineDataNodeType.DELETE


/**
 * eatTo 函数的状态数据
 */
export interface DeleteEatingState {
  /**
   * 左边界
   */
  leftFlanking: DataNodeTokenFlanking | null
}


/**
 * 匹配得到的结果
 */
export interface DeleteMatchedResultItem extends DataNodeTokenPosition<T> {

}


/**
 * Lexical Analyzer for DeleteDataNode
 */
export class DeleteTokenizer
  extends BaseInlineDataNodeTokenizer<T, DeleteMatchedResultItem, DeleteEatingState>
  implements DataNodeTokenizer<T> {
  public readonly name = 'DeleteTokenizer'

  /**
   * override
   */
  protected eatTo(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    precedingTokenPosition: DataNodeTokenPosition<InlineDataNodeType> | null,
    state: DeleteEatingState,
    startOffset: number,
    endOffset: number,
    result: DeleteMatchedResultItem[],
  ): void {
    const self = this
    for (let i = startOffset; i < endOffset; ++i) {
      const p = codePoints[i]
      switch (p.codePoint) {
        case CodePoint.BACK_SLASH:
          ++i
          break
        /**
         * Strike through text is any text wrapped in two tildes '~'
         * @see https://github.github.com/gfm/#strikethrough-extension-
         */
        case CodePoint.TILDE: {
          for (; i + 1 < endOffset && codePoints[i + 1].codePoint === p.codePoint;) i += 1
          if (i - p.offset + 1 < 2) break

          const q = codePoints[i]
          const flanking: DataNodeTokenFlanking = {
            start: q.offset - 1,
            end: q.offset + 1,
            thickness: 2
          }

          // 是否已有合法的左边界，若没有，则更新左边界
          if (state.leftFlanking == null) {
            state.leftFlanking = flanking
            break
          }

          // 否则，找到一个匹配的右边界
          const resultItem: DeleteMatchedResultItem = {
            type: InlineDataNodeType.DELETE,
            left: state.leftFlanking!,
            right: flanking,
            children: [],
            _unExcavatedContentPieces: [
              {
                start: state.leftFlanking!.end,
                end: flanking.start,
              }
            ],
          }
          result.push(resultItem)
          self.initializeEatingState(state)
          break
        }
      }
    }
  }

  /**
   * override
   */
  protected initializeEatingState(state: DeleteEatingState): void {
    state.leftFlanking = null
  }
}
