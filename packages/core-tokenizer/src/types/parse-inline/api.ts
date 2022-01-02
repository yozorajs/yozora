import type { INodePoint } from '@yozora/character'

/**
 * Api in parse-inline phase.
 */
export interface IParseInlinePhaseApi {
  /**
   * Get the node points.
   */
  getNodePoints(): ReadonlyArray<INodePoint>

  /**
   * Check if there is exists a definition with the given identifier.
   * @param identifier
   */
  hasDefinition(identifier: string): boolean

  /**
   * Check if there is exists a footnote definition with the given identifier.
   * @param identifier
   */
  hasFootnoteDefinition(identifier: string): boolean
}
