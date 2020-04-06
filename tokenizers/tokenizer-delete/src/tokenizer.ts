import {
  CodePoint,
  BaseInlineDataNodeTokenizer,
  DataNodeTokenFlanking,
  DataNodeTokenPointDetail,
  InlineDataNodeTokenPosition,
  InlineDataNode,
  InlineDataNodeTokenizer,
  InlineDataNodeType,
} from '@yozora/tokenizer-core'
import { DeleteDataNodeData, DeleteDataNodeType } from './types'


type T = DeleteDataNodeType


export interface DeleteEatingState {
  /**
   * 左边界
   */
  leftFlanking: DataNodeTokenFlanking | null
}


export interface DeleteMatchedResultItem extends InlineDataNodeTokenPosition<T> {

}


/**
 * Lexical Analyzer for DeleteDataNode
 */
export class DeleteTokenizer extends BaseInlineDataNodeTokenizer<
  T,
  DeleteDataNodeData,
  DeleteMatchedResultItem,
  DeleteEatingState>
  implements InlineDataNodeTokenizer<T> {
  public readonly name = 'DeleteTokenizer'
  public readonly recognizedTypes: T[] = [DeleteDataNodeType]

  /**
   * override
   */
  protected eatTo(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    precedingTokenPosition: InlineDataNodeTokenPosition<InlineDataNodeType> | null,
    state: DeleteEatingState,
    startOffset: number,
    endOffset: number,
    result: DeleteMatchedResultItem[],
  ): void {
    if (startOffset >= endOffset) return
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
            // eslint-disable-next-line no-param-reassign
            state.leftFlanking = flanking
            break
          }

          // 否则，找到一个匹配的右边界
          const resultItem: DeleteMatchedResultItem = {
            type: DeleteDataNodeType,
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
  protected parseData(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    tokenPosition: DeleteMatchedResultItem,
    children: InlineDataNode[],
  ): DeleteDataNodeData {
    return {
      children,
    }
  }

  /**
   * override
   */
  protected initializeEatingState(state: DeleteEatingState): void {
    // eslint-disable-next-line no-param-reassign
    state.leftFlanking = null
  }
}
