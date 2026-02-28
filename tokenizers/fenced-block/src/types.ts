import type { NodeType } from '@yozora/ast'
import type { ICodePoint, INodePoint } from '@yozora/character'
import type {
  IBaseBlockTokenizerProps,
  IPartialBlockToken,
  IPhrasingContentLine,
  ITokenizer,
} from '@yozora/core-tokenizer'

export const FencedBlockType = 'fencedBlock'

export type FencedBlockType = typeof FencedBlockType

export interface IToken<T extends NodeType> extends IPartialBlockToken<T> {
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
  lines: IPhrasingContentLine[]
  /**
   * Meta info string
   */
  infoString: INodePoint[]
}

export interface IFencedBlockHookContext<T extends NodeType> extends ITokenizer {
  /**
   * Type of special FencedBlock token and FencedBlock node.
   */
  nodeType: T
  /**
   * Available fence markers.
   */
  markers: ICodePoint[]
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
    infoString: readonly INodePoint[],
    marker: ICodePoint,
    countOfMarker: number,
  ): boolean
}

export interface ITokenizerProps<T extends NodeType> extends Partial<IBaseBlockTokenizerProps> {
  /**
   * ITokenizer name.
   */
  name: string
  /**
   * Type of special FencedBlock token and FencedBlock node.
   */
  nodeType: T
  /**
   * Available fence markers.
   */
  markers: ICodePoint[]
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
    infoString: readonly INodePoint[],
    marker: ICodePoint,
    countOfMarker: number,
  ): boolean
}
