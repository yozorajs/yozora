import type { NodePoint } from '@yozora/character'
import type {
  ResultOfRequiredEater,
  YastMeta as Meta,
  YastNode,
} from '@yozora/tokenizercore'
import type {
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerParsePhaseHook,
  ResultOfFindDelimiters,
  ResultOfProcessFullDelimiter,
} from '@yozora/tokenizercore-inline'
import type {
  Autolink as Node,
  AutolinkContentType,
  AutolinkToken as Token,
  AutolinkTokenDelimiter as Delimiter,
  AutolinkType as T,
} from './types'
import { AsciiCodePoint, calcStringFromNodePoints } from '@yozora/character'
import { encodeLinkDestination } from '@yozora/tokenizercore'
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
  nodePoints: ReadonlyArray<NodePoint>,
  startIndex: number,
  endIndex: number,
) => ResultOfRequiredEater
type ContentHelper = { contentType: AutolinkContentType, eat: ContentEater }


const helpers: ReadonlyArray<ContentHelper> = [
  { contentType: 'uri', eat: eatAbsoluteUri },
  { contentType: 'email', eat: eatEmailAddress },
]


/**
 * Lexical Analyzer for Autolink
 */
export class AutolinkTokenizer implements
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook<T, Meta, Token, Delimiter>,
  InlineTokenizerParsePhaseHook<T, Meta, Token, Node>
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
  }

  /**
   * @override
   * @see InlineTokenizerMatchPhaseHook
   */
  public findDelimiter(
    startIndex: number,
    endIndex: number,
    nodePoints: ReadonlyArray<NodePoint>,
  ): ResultOfFindDelimiters<Delimiter> {
    for (let i = startIndex; i < endIndex; ++i) {
      if (nodePoints[i].codePoint !== AsciiCodePoint.OPEN_ANGLE) continue

      let nextIndex: number = endIndex
      let contentType: AutolinkContentType | null = null
      for (const helper of helpers) {
        const eatResult = helper.eat(nodePoints, i + 1, endIndex)
        nextIndex = Math.min(nextIndex, eatResult.nextIndex)
        if (eatResult.valid) {
          contentType = helper.contentType
          nextIndex = eatResult.nextIndex
          break
        }
      }

      // Optimization: move forward to the next latest potential position.
      if (contentType == null) {
        i = Math.max(i, nextIndex - 1)
        continue
      }

      if (
        nextIndex < endIndex &&
        nodePoints[nextIndex].codePoint === AsciiCodePoint.CLOSE_ANGLE
      ) {
        const delimiter: Delimiter = {
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
    fullDelimiter: Delimiter,
    nodePoints: ReadonlyArray<NodePoint>,
    meta: Readonly<Meta>,
  ): ResultOfProcessFullDelimiter<T, Token> {
    const token: Token = {
      type: AutolinkType,
      startIndex: fullDelimiter.startIndex,
      endIndex: fullDelimiter.endIndex,
      contentType: fullDelimiter.contentType,
      content: fullDelimiter.content,
    }

    const context = this.getContext()
    if (context != null) {
      token.children = context.resolveFallbackTokens(
        [],
        token.content.startIndex,
        token.content.endIndex,
        nodePoints,
        meta
      )
    }
    return token
  }

  /**
   * @override
   * @see InlineTokenizerParsePhaseHook
   */
  public processToken(
    token: Token,
    children: YastNode[] | undefined,
    nodePoints: ReadonlyArray<NodePoint>,
  ): Node {
    const { content } = token

    // Backslash-escapes do not work inside autolink.
    let url = calcStringFromNodePoints(
      nodePoints, content.startIndex, content.endIndex)

    // Add 'mailto:' prefix to email address type autolink.
    if (token.contentType === 'email') {
      url = 'mailto:' + url
    }

    const encodedUrl = encodeLinkDestination(url)
    const result: Node = {
      type: AutolinkType,
      url: encodedUrl,
      children: children || [],
    }
    return result
  }
}
