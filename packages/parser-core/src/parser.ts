import type { DataNodeTokenPointDetail } from '@yozora/tokenizercore'
import type {
  BlockDataNode,
  BlockDataNodeMetaData,
  BlockTokenizerContext,
  BlockTokenizerParsePhaseState,
} from '@yozora/tokenizercore-block'
import type { InlineTokenizerContext } from '@yozora/tokenizercore-inline'
import type { DataNodeParser, ParseResult } from './types'
import { calcDataNodeTokenPointDetail } from '@yozora/tokenizercore'


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
  value: DataNodeTokenPointDetail[]
}


export class DefaultDataNodeParser implements DataNodeParser {
  protected readonly blockContext: BlockTokenizerContext
  protected readonly inlineContext: InlineTokenizerContext
  protected readonly resolveRawContentsField?: (o: BlockDataNode) => ContentsField | null

  public constructor(
    blockContext: BlockTokenizerContext,
    inlineContext: InlineTokenizerContext,
    resolveRawContentsField?: (o: BlockDataNode) => ContentsField | null,
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
    codePositions?: DataNodeTokenPointDetail[],
  ): ParseResult {
    const result: ParseResult = {
      type: 'root',
      meta: {},
      children: [],
    }

    // calc codePositions from content
    if (codePositions == null) {
      // eslint-disable-next-line no-param-reassign
      codePositions = calcDataNodeTokenPointDetail(content)
    }

    // Optimization: directly return when there are no non-blank characters
    if (codePositions == null || codePositions.length <= 0) {
      return result
    }

    const startIndex = Math.min(
      codePositions.length - 1,
      Math.max(0, _startIndex == null ? 0 : _startIndex))
    const endIndex = Math.min(
      codePositions.length,
      Math.max(0, _endIndex == null ? codePositions.length : _endIndex))

    // Optimization: directly return when there are no non-blank characters
    if (startIndex >= endIndex) return result

    const preMatchPhaseStateTree = this.blockContext.preMatch(
      codePositions, startIndex, endIndex)
    const matchPhaseStateTree = this.blockContext.match(preMatchPhaseStateTree)
    const postMatchPhaseStateTree = this.blockContext.postMatch(matchPhaseStateTree)
    const preParsePhaseTree = this.blockContext.preParse(postMatchPhaseStateTree)
    const parsePhaseStateTree = this.blockContext.parse(postMatchPhaseStateTree, preParsePhaseTree)
    const postParsePhaseStateTree = this.blockContext.postParse(parsePhaseStateTree)

    const { children } = this.deepParse(postParsePhaseStateTree, postParsePhaseStateTree.meta)
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
    o: BlockTokenizerParsePhaseState,
    meta: BlockDataNodeMetaData
  ): BlockTokenizerParsePhaseState {
    if (this.resolveRawContentsField == null) return o

    // deep match inline contents
    const field = this.resolveRawContentsField(o)
    if (field != null) {
      const rawContent = {
        codePositions: field.value,
        meta,
      }
      const matchPhaseStateTree = this.inlineContext.match(
        rawContent, 0, rawContent.codePositions.length)
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
