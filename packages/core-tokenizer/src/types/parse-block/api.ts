import type { IYastNode } from '@yozora/ast'
import type { IPhrasingContent, IPhrasingContentLine } from '../phrasing-content'
import type { IYastBlockToken } from '../token'

/**
 * Api in parse-block phase.
 */
export interface IParseBlockPhaseApi {
  /**
   * Whether it is necessary to reserve the position in the IYastNode produced.
   */
  readonly shouldReservePosition: boolean
  /**
   * Build IPhrasingContent from a PhrasingContentToken.
   * @param lines
   */
  buildPhrasingContent(lines: ReadonlyArray<IPhrasingContentLine>): IPhrasingContent | null
  /**
   * Parse phrasing content to Yozora AST nodes.
   * @param phrasingContent
   */
  parsePhrasingContent(phrasingContent: IPhrasingContent): IYastNode[]
  /**
   * Parse block tokens to Yozora AST nodes.
   * @param tokens
   */
  parseBlockTokens(tokens?: ReadonlyArray<IYastBlockToken>): IYastNode[]
}
