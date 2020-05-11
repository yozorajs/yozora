import { AsciiCodePoint } from '@yozora/character'
import {
  BaseInlineDataNodeTokenizer,
  DataNodeTokenFlanking,
  DataNodeTokenPointDetail,
  InlineDataNode,
  InlineDataNodeMatchResult,
  InlineDataNodeMatchState,
  InlineDataNodeTokenizer,
  InlineDataNodeType,
} from '@yozora/tokenizercore'
import { DeleteDataNodeData, DeleteDataNodeType } from './types'


type T = DeleteDataNodeType


export interface DeleteDataNodeMatchState extends InlineDataNodeMatchState {
  /**
   * 左边界
   */
  leftFlanking: DataNodeTokenFlanking | null
}


export interface DeleteDataNodeMatchResult extends InlineDataNodeMatchResult<T> {

}


/**
 * Lexical Analyzer for DeleteDataNode
 */
export class DeleteTokenizer
  extends BaseInlineDataNodeTokenizer<
    T,
    DeleteDataNodeData,
    DeleteDataNodeMatchState,
    DeleteDataNodeMatchResult>
  implements InlineDataNodeTokenizer<
    T,
    DeleteDataNodeData,
    DeleteDataNodeMatchResult> {

  public readonly name = 'DeleteTokenizer'
  public readonly recognizedTypes: T[] = [DeleteDataNodeType]

  /**
   * override
   */
  protected eatTo(
    codePoints: DataNodeTokenPointDetail[],
    precedingTokenPosition: InlineDataNodeMatchResult<InlineDataNodeType> | null,
    state: DeleteDataNodeMatchState,
    startIndex: number,
    endIndex: number,
    result: DeleteDataNodeMatchResult[],
  ): void {
    if (startIndex >= endIndex) return
    const self = this
    for (let i = startIndex; i < endIndex; ++i) {
      const p = codePoints[i]
      switch (p.codePoint) {
        case AsciiCodePoint.BACK_SLASH:
          ++i
          break
        /**
         * Strike through text is any text wrapped in two tildes '~'
         * @see https://github.github.com/gfm/#strikethrough-extension-
         */
        case AsciiCodePoint.TILDE: {
          for (; i + 1 < endIndex && codePoints[i + 1].codePoint === p.codePoint;) i += 1
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
          const resultItem: DeleteDataNodeMatchResult = {
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
          self.initializeMatchState(state)
          break
        }
      }
    }
  }

  /**
   * override
   */
  protected parseData(
    codePoints: DataNodeTokenPointDetail[],
    matchResult: DeleteDataNodeMatchResult,
    children: InlineDataNode[],
  ): DeleteDataNodeData {
    return {
      children,
    }
  }

  /**
   * override
   */
  protected initializeMatchState(state: DeleteDataNodeMatchState): void {
    // eslint-disable-next-line no-param-reassign
    state.leftFlanking = null
  }
}
