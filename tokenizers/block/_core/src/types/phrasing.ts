import { DataNodeTokenPointDetail } from '@yozora/tokenizercore'
import { BlockDataNode } from './base'
import { BlockTokenizerMatchPhaseState } from './lifecycle/match'
import { BlockTokenizerParsePhaseState } from './lifecycle/parse'


/**
 * typeof PhrasingContentDataNode
 */
export const PhrasingContentDataNodeType = 'PHRASING_CONTENT'
export type PhrasingContentDataNodeType = typeof PhrasingContentDataNodeType


/**
 * Phrasing content lines
 */
export interface PhrasingContentLine {
  /**
   * code points of current line
   */
  codePositions: DataNodeTokenPointDetail[]
  /**
   * The index of first non-blank character in the rest of the current line
   */
  firstNonWhiteSpaceIndex: number
}


/**
 * Phrasing content represent the text in a document, and its markup.
 *
 * @see https://github.com/syntax-tree/mdast#phrasingcontent
 */
export interface PhrasingContentDataNode extends
  BlockDataNode<PhrasingContentDataNodeType>,
  BlockTokenizerParsePhaseState<PhrasingContentDataNodeType> {
  /**
   * Inline data nodes
   */
  contents: DataNodeTokenPointDetail[]
}


/**
 * State of match phase of PhrasingContentTokenizer
 */
export interface PhrasingContentMatchPhaseState
  extends BlockTokenizerMatchPhaseState<PhrasingContentDataNodeType> {
  /**
   * PhrasingContent 中的文本内容
   */
  lines: PhrasingContentLine[]
}
