import type {
  EnhancedYastNodePoint,
  YastMeta as M,
} from '@yozora/tokenizercore'
import type {
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerParsePhaseHook,
  ResultOfFindDelimiters,
  ResultOfProcessFullDelimiter,
  YastInlineNode,
} from '@yozora/tokenizercore-inline'
import type {
  Autolink as PS,
  AutolinkMatchPhaseState as MS,
  AutolinkTokenDelimiter as TD,
  AutolinkType as T,
  ContentType,
} from './types'
import { AsciiCodePoint } from '@yozora/character'
import { calcStringFromNodePoints } from '@yozora/tokenizercore'
import { AutolinkType } from './types'
import { eatEmailAddress } from './util/email'
import { eatAbsoluteUri } from './util/uri'


/**
 * Params for constructing AutolinkTokenizer
 */
export interface AutolinkTokenizerProps {
  /**
   * Delimiter group identity.
   */
  readonly delimiterGroup?: string
  /**
   * Delimiter priority.
   */
  readonly delimiterPriority?: number
}


type ContentEater = (
  nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  startIndex: number,
  endIndex: number,
) => number | null
type ContentHelper = { contentType: ContentType, eat: ContentEater }


const helpers: ReadonlyArray<ContentHelper> = [
  { contentType: 'uri', eat: eatAbsoluteUri },
  { contentType: 'email', eat: eatEmailAddress },
]


/**
 * Lexical Analyzer for Autolink
 */
export class AutolinkTokenizer implements
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook<T, M, MS, TD>,
  InlineTokenizerParsePhaseHook<T, M, MS, PS>
{
  public readonly name = 'AutolinkTokenizer'
  public readonly getContext: InlineTokenizer['getContext'] = () => null

  public readonly delimiterGroup: string = 'AutolinkTokenizer'
  public readonly recognizedTypes: T[] = [AutolinkType]
  public readonly delimiterPriority: number = Number.MAX_SAFE_INTEGER

  public constructor(props: AutolinkTokenizerProps = {}) {
    if (props.delimiterPriority != null) {
      this.delimiterPriority = props.delimiterPriority
    }
    if (props.delimiterGroup != null) {
      this.delimiterGroup = props.delimiterGroup
    }
    if (props.delimiterGroup != null) {
      this.delimiterGroup = props.delimiterGroup
    }
  }

  /**
   * @override
   * @see InlineTokenizerMatchPhaseHook
   */
  public findDelimiter(
    startIndex: number,
    endIndex: number,
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  ): ResultOfFindDelimiters<TD> {
    for (let i = startIndex; i < endIndex; ++i) {
      if (nodePoints[i].codePoint !== AsciiCodePoint.OPEN_ANGLE) continue

      let nextIndex: number | null = null
      let contentType: ContentType | null = null
      for (const helper of helpers) {
        nextIndex = helper.eat(nodePoints, i + 1, endIndex)
        if (nextIndex != null) {
          contentType = helper.contentType
          break
        }
      }

      if (contentType == null || nextIndex == null) continue

      if (
        nextIndex < endIndex &&
        nodePoints[nextIndex].codePoint === AsciiCodePoint.CLOSE_ANGLE
      ) {
        const delimiter: TD = {
          type: 'full',
          startIndex: i,
          endIndex: nextIndex + 1,
          contentType,
          content: {
            startIndex: i + 1,
            endIndex: nextIndex,
          }
        }
        return delimiter
      }
      i = nextIndex - 1
    }
    return null
  }

  /**
   * @override
   * @see InlineTokenizerMatchPhaseHoo
   */
  public processFullDelimiter(
    fullDelimiter: TD,
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    meta: Readonly<M>,
  ): ResultOfProcessFullDelimiter<T, MS> {
    const state: MS = {
      type: AutolinkType,
      startIndex: fullDelimiter.startIndex,
      endIndex: fullDelimiter.endIndex,
      contentType: fullDelimiter.contentType,
      content: fullDelimiter.content,
    }

    const context = this.getContext()
    if (context != null) {
      state.children = context.resolveFallbackStates(
        [],
        state.content.startIndex,
        state.content.endIndex,
        nodePoints,
        meta
      )
    }
    return state
  }

  /**
   * @override
   * @see InlineTokenizerParsePhaseHook
   */
  public parse(
    matchPhaseState: MS,
    parsedChildren: YastInlineNode[] | undefined,
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  ): PS {
    const { content } = matchPhaseState

    // Backslash-escapes do not work inside autolink.
    let url = calcStringFromNodePoints(
      nodePoints, content.startIndex, content.endIndex)

    // Add 'mailto:' prefix to email address type autolink.
    if (matchPhaseState.contentType === 'email') {
      url = 'mailto:' + url
    }

    const result: PS = {
      type: AutolinkType,
      url,
      children: parsedChildren || [],
    }
    return result
  }
}
