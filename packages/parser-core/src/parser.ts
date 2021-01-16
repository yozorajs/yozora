import type { EnhancedYastNodePoint, YastMeta } from '@yozora/tokenizercore'
import type {
  BlockTokenizerContext,
  BlockTokenizerContextParsePhaseState,
  BlockTokenizerParsePhaseState,
  YastBlockNode,
} from '@yozora/tokenizercore-block'
import type { InlineTokenizerContext } from '@yozora/tokenizercore-inline'
import type { DataNodeParser, ParseResult } from './types'
import { calcEnhancedYastNodePoints } from '@yozora/tokenizercore'


/**
 *
 */
export interface ContentsField {
  /**
   * Field name which will be rewritten with inline data nodes
   */
  name: string
  /**
   * Inline contents
   */
  value: EnhancedYastNodePoint[]
}


export class DefaultDataNodeParser implements DataNodeParser {
  protected readonly blockContext: BlockTokenizerContext
  protected readonly inlineContext: InlineTokenizerContext
  protected readonly resolveRawContentsField?: (o: YastBlockNode) => ContentsField | null

  public constructor(
    blockContext: BlockTokenizerContext,
    inlineContext: InlineTokenizerContext,
    resolveRawContentsField?: (o: YastBlockNode) => ContentsField | null,
  ) {
    this.blockContext = blockContext
    this.inlineContext = inlineContext
    this.resolveRawContentsField = resolveRawContentsField
  }

  /**
   * @override
   */
  public parse(
    content: string,
    _startIndex?: number,
    _endIndex?: number,
    nodePoints?: EnhancedYastNodePoint[],
  ): ParseResult {
    const result: ParseResult = {
      type: 'root',
      meta: {},
      children: [],
    }

    // calc nodePoints from content
    if (nodePoints == null) {
      // eslint-disable-next-line no-param-reassign
      nodePoints = calcEnhancedYastNodePoints(content)
    }

    // Optimization: directly return when there are no non-blank characters
    if (nodePoints == null || nodePoints.length <= 0) {
      return result
    }

    const startIndex = Math.min(
      nodePoints.length - 1,
      Math.max(0, _startIndex == null ? 0 : _startIndex))
    const endIndex = Math.min(
      nodePoints.length,
      Math.max(0, _endIndex == null ? nodePoints.length : _endIndex))

    // Optimization: directly return when there are no non-blank characters
    if (startIndex >= endIndex) return result

    const matchPhaseStateTree = this.blockContext.match(nodePoints, startIndex, endIndex)
    const postMatchPhaseStateTree = this.blockContext.postMatch(matchPhaseStateTree)
    const parsePhaseStateTree = this.blockContext.parse(postMatchPhaseStateTree)
    const postParsePhaseStateTree = this.blockContext.postParse(parsePhaseStateTree)

    const { children } = this.deepParse(
      postParsePhaseStateTree as unknown as BlockTokenizerContextParsePhaseState,
      postParsePhaseStateTree.meta
    )
    result.meta = postParsePhaseStateTree.meta
    result.children = children!
    return result
  }

  /**
   * Deep parse inline contents
   * @param o     current data node
   * @param meta  metadata of state tree
   */
  protected deepParse(
    o: BlockTokenizerContextParsePhaseState,
    meta: YastMeta
  ): BlockTokenizerParsePhaseState {
    if (this.resolveRawContentsField == null) return o

    // deep match inline contents
    const field = this.resolveRawContentsField(o as any)
    if (field != null) {
      const rawContent = {
        nodePoints: field.value,
        meta,
      }
      const matchPhaseStateTree = this.inlineContext.match(
        rawContent, 0, rawContent.nodePoints.length)
      const postMatchPhaseStateTree = this.inlineContext.postMatch(
        rawContent, matchPhaseStateTree)
      const parsePhaseMetaTree = this.inlineContext.parse(
        rawContent, postMatchPhaseStateTree)
      return { ...o, [field.name]: parsePhaseMetaTree.children }
    }

    // recursively match
    if (o.children != null && o.children.length > 0) {
      const children = o.children.map(u => this.deepParse(u, meta))
      return { ...o, children }
    }

    return o
  }
}
