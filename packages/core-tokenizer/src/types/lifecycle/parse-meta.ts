import type { RootMeta, YastNode } from '@yozora/ast'

/**
 * Hooks in the parse-meta phase
 */
export interface TokenizerParseMetaHook {
  /**
   * Parse partial data of the root meta.
   * @param nodes   Parsed block YastNodes
   */
  parseMeta(
    nodes: ReadonlyArray<YastNode>,
    currentMeta: Readonly<RootMeta>,
  ): Partial<RootMeta>
}
