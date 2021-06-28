import type { YastNodeType } from '@yozora/ast'
import type { CodePoint, NodePoint } from '@yozora/character'
import type {
  BaseBlockTokenizerProps,
  PartialYastBlockToken,
  PhrasingContentLine,
} from '@yozora/core-tokenizer'

export const FencedBlockType = 'fencedBlock'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type FencedBlockType = typeof FencedBlockType

export interface Token<T extends YastNodeType>
  extends PartialYastBlockToken<T> {
  /**
   * Line indent of a fenced block.
   */
  indent: number
  /**
   * Fence marker.
   */
  marker: number
  /**
   * The number of fence marker.
   */
  markerCount: number
  /**
   * Lines to construct the contents of a paragraph.
   */
  lines: PhrasingContentLine[]
  /**
   * Meta info string
   */
  infoString: NodePoint[]
}

export interface TokenizerProps<T extends YastNodeType>
  extends Partial<BaseBlockTokenizerProps> {
  /**
   * Tokenizer name.
   */
  name: string
  /**
   * Type of special FencedBlock token and FencedBlock node.
   */
  nodeType: T
  /**
   * Available fence markers.
   */
  markers: CodePoint[]
  /**
   * The minimum amount required
   */
  markersRequired: number
  /**
   * Check if the info string is valid.
   * @param infoString
   * @param marker
   * @param countOfMarker
   */
  checkInfoString?(
    infoString: Readonly<NodePoint[]>,
    marker: CodePoint,
    countOfMarker: number,
  ): boolean
}
