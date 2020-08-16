import {
  DataNodeTokenPointDetail,
  calcDataNodeTokenPointDetail,
} from '@yozora/tokenizercore'
import {
  BlockDataNode,
  BlockDataNodeMetaData,
  BlockTokenizerContext,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseState,
} from '@yozora/tokenizercore-block'
import { InlineTokenizerContext } from '@yozora/tokenizercore-inline'
import { DataNodeParser, MatchResult, ParseResult } from './types'


export class DefaultDataNodeParser implements DataNodeParser {
  protected readonly blockContext: BlockTokenizerContext
  protected readonly inlineContext: InlineTokenizerContext
  protected readonly resolveRawContentsField?: (o: BlockDataNode) => string | null

  public constructor(
    blockContext: BlockTokenizerContext,
    inlineContext: InlineTokenizerContext,
    resolveRawContentsField?: (o: BlockDataNode) => (keyof typeof o) | string | null
  ) {
    this.blockContext = blockContext
    this.inlineContext = inlineContext
    this.resolveRawContentsField = resolveRawContentsField
  }

  /**
   * @override
   */
  public match(
    content: string,
    _startIndex?: number,
    _endIndex?: number,
    codePositions?: DataNodeTokenPointDetail[],
  ): MatchResult {
    const result: MatchResult = {
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

    this.deepMatch(postMatchPhaseStateTree, preParsePhaseTree.meta)
    result.meta = preParsePhaseTree.meta
    result.children = postMatchPhaseStateTree.children
    return result
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

    this.deepParse(postParsePhaseStateTree, postParsePhaseStateTree.meta)
    result.meta = postParsePhaseStateTree.meta
    result.children = postParsePhaseStateTree.children
    return result
  }

  /**
   * Deep match inline contents
   * @param o     current data node
   * @param meta  metadata of state tree
   */
  protected deepMatch(o: BlockTokenizerMatchPhaseState, meta: BlockDataNodeMetaData): void {
    if (this.resolveRawContentsField == null) return

    // deep match inline contents
    const field = this.resolveRawContentsField(o)
    if (typeof field === 'string' && field.length > 0) {
      const rawContent = {
        codePositions: o[field] as DataNodeTokenPointDetail[],
        meta,
      }
      const matchPhaseStateTree = this.inlineContext.match(
        rawContent, 0, rawContent.codePositions.length)
      const postMatchPhaseStateTree = this.inlineContext.postMatch(
        rawContent, matchPhaseStateTree)

      // eslint-disable-next-line no-param-reassign
      o[field] = postMatchPhaseStateTree.children
      return
    }

    // recursively match
    if (o.children != null && o.children.length > 0) {
      for (const u of o.children) {
        this.deepMatch(u, meta)
      }
    }
  }


  /**
   * Deep parse inline contents
   * @param o     current data node
   * @param meta  metadata of state tree
   */
  protected deepParse(o: BlockTokenizerParsePhaseState, meta: BlockDataNodeMetaData): void {
    if (this.resolveRawContentsField == null) return

    // deep match inline contents
    const field = this.resolveRawContentsField(o)
    if (typeof field === 'string' && field.length > 0) {
      const rawContent = {
        codePositions: o[field] as DataNodeTokenPointDetail[],
        meta,
      }
      const matchPhaseStateTree = this.inlineContext.match(
        rawContent, 0, rawContent.codePositions.length)
      const postMatchPhaseStateTree = this.inlineContext.postMatch(
        rawContent, matchPhaseStateTree)
      const parsePhaseMetaTree = this.inlineContext.parse(
        rawContent, postMatchPhaseStateTree)

      // eslint-disable-next-line no-param-reassign
      o[field] = parsePhaseMetaTree.children
      return
    }

    // recursively match
    if (o.children != null && o.children.length > 0) {
      for (const u of o.children) {
        this.deepParse(u, meta)
      }
    }
  }
}
