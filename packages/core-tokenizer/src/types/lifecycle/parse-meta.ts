import type { YastNode } from '../node'

/**
 * Hooks in the parse-meta phase
 */
export interface TokenizerParseMetaHook<
  Node extends YastNode = YastNode,
  MetaData extends unknown = unknown
> {
  /**
   * Parse meta nodes
   * @param state       state on post-match phase
   */
  parseMeta: (states: ReadonlyArray<Node>) => MetaData
}
