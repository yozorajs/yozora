import type { DataNodeTokenPointDetail } from '@yozora/tokenizercore'
import type { BlockDataNode } from './base'
import type { BlockTokenizerMatchPhaseState } from './lifecycle/match'
import type { BlockTokenizerParsePhaseState } from './lifecycle/parse'


/**
 * typeof PhrasingContentDataNode
 */
export const PhrasingContentDataNodeType = 'PHRASING_CONTENT'
// eslint-disable-next-line @typescript-eslint/no-redeclare
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
