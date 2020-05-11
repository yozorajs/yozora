import {
  BaseInlineDataNodeTokenizer,
  DataNodeTokenPointDetail,
  InlineDataNodeMatchResult,
  InlineDataNodeMatchState,
  InlineDataNodeTokenizer,
  InlineDataNodeType,
  calcStringFromCodePointsIgnoreEscapes,
} from '@yozora/tokenizercore'
import { TextDataNodeData, TextDataNodeType } from './types'


type T = TextDataNodeType


export interface TextDataNodeMatchState extends InlineDataNodeMatchState {

}


export interface TextDataNodeMatchedResult extends InlineDataNodeMatchResult<T> {

}


/**
 * Lexical Analyzer for TextDataNode
 */
export class TextTokenizer
  extends BaseInlineDataNodeTokenizer<
    T,
    TextDataNodeData,
    TextDataNodeMatchState,
    TextDataNodeMatchedResult>
  implements InlineDataNodeTokenizer<
    T,
    TextDataNodeData,
    TextDataNodeMatchedResult> {

  public readonly name = 'TextTokenizer'
  public readonly recognizedTypes: T[] = [TextDataNodeType]

  /**
   * override
   */
  protected eatTo(
    codePoints: DataNodeTokenPointDetail[],
    precedingTokenPosition: InlineDataNodeMatchResult<InlineDataNodeType> | null,
    state: TextDataNodeMatchState,
    startIndex: number,
    endIndex: number,
    result: TextDataNodeMatchedResult[],
  ): void {
    if (startIndex >= endIndex) return
    result.push({
      type: TextDataNodeType,
      left: { start: startIndex, end: startIndex, thickness: 0 },
      right: { start: endIndex, end: endIndex, thickness: 0 },
      children: [],
    })
  }

  /**
   * override
   */
  protected parseData(
    codePoints: DataNodeTokenPointDetail[],
    matchResult: TextDataNodeMatchedResult,
  ): TextDataNodeData {
    const start: number = matchResult.left.end
    const end: number = matchResult.right.start
    const value: string = calcStringFromCodePointsIgnoreEscapes(codePoints, start, end)
    return { value }
  }
}
