import type { NodePoint } from '@yozora/character'
import type { YastBlockState } from './lifecycle/match-block'
import type { YastMeta } from './node'
import type {
  PhrasingContent,
  PhrasingContentLine,
  PhrasingContentState,
} from './phrasing-content'
import type { YastToken } from './token'

/**
 * Context of Tokenizer.
 */
export interface TokenizerContext<Meta extends YastMeta = YastMeta> {
  /**
   * Build PhrasingContentPostMatchPhaseState from array of PhrasingContentLine
   * @param lines
   */
  buildPhrasingContentState(
    lines: ReadonlyArray<PhrasingContentLine>,
  ): PhrasingContentState | null

  /**
   * Build PhrasingContentMatchPhaseState from array of PhrasingContentLine
   *
   * @param nodePoints
   * @param lines
   */
  buildPhrasingContent(
    state: Readonly<PhrasingContentState>,
  ): PhrasingContent | null

  /**
   * Build BlockTokenizerPostMatchPhaseState.
   *
   * @param lines
   * @param originalState
   */
  buildBlockState(
    lines: ReadonlyArray<PhrasingContentLine>,
    originalState: Readonly<YastBlockState>,
  ): YastBlockState | null

  /**
   * Extract array of PhrasingContentLine from a given YastBlockState.
   * @param state
   */
  extractPhrasingContentLines(
    originalState: Readonly<YastBlockState>,
  ): ReadonlyArray<PhrasingContentLine> | null

  /**
   * Resolve raw contents with fallback tokenizer.
   *
   * @param tokens
   * @param startIndex
   * @param endIndex
   * @param nodePoints
   * @param meta
   */
  resolveFallbackTokens(
    tokens: ReadonlyArray<YastToken>,
    startIndex: number,
    endIndex: number,
    nodePoints: ReadonlyArray<NodePoint>,
    meta: Readonly<Meta>,
  ): YastToken[]
}
