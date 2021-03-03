import type { NodePoint } from '@yozora/character'
import { AsciiCodePoint, calcStringFromNodePoints } from '@yozora/character'
import type {
  ResultOfFindDelimiters,
  ResultOfProcessFullDelimiter,
  ResultOfRequiredEater,
  Tokenizer,
  TokenizerMatchInlineHook,
  TokenizerParseInlineHook,
  YastMeta as Meta,
  YastNode,
} from '@yozora/core-tokenizer'
import { encodeLinkDestination } from '@yozora/core-tokenizer'
import type {
  Autolink as Node,
  AutolinkContentType,
  AutolinkToken as Token,
  AutolinkTokenDelimiter as Delimiter,
  AutolinkType as T,
} from './types'
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
interface ContentHelper {
  contentType: AutolinkContentType
  eat: ContentEater
}

const helpers: ReadonlyArray<ContentHelper> = [
  { contentType: 'uri', eat: eatAbsoluteUri },
  { contentType: 'email', eat: eatEmailAddress },
]

/**
 * Lexical Analyzer for Autolink.
 *
 * Autolinks are absolute URIs and email addresses inside '<' and '>'.
 * They are parsed as links, with the URL or email address as the link label.
 *
 * @see https://github.github.com/gfm/#autolink
 */
export class AutolinkTokenizer
  implements
    Tokenizer<T>,
    TokenizerMatchInlineHook<T, Delimiter, Token, Meta>,
    TokenizerParseInlineHook<T, Token, Node, Meta> {
  public readonly name: string = AutolinkTokenizer.name
  public readonly recognizedTypes: T[] = [AutolinkType]
  public readonly getContext: Tokenizer['getContext'] = () => null

  public readonly delimiterGroup: string = AutolinkTokenizer.name
  public readonly delimiterPriority: number = Number.MAX_SAFE_INTEGER

  /* istanbul ignore next */
  constructor(props: AutolinkTokenizerProps = {}) {
    if (props.delimiterPriority != null) {
      this.delimiterPriority = props.delimiterPriority
    }
    if (props.delimiterGroup != null) {
      this.delimiterGroup = props.delimiterGroup
    }
  }

  /**
   * @override
   * @see TokenizerMatchInlineHook
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
          },
        }
        return delimiter
      }
      i = nextIndex - 1
    }
    return null
  }

  /**
   * @override
   * @see TokenizerMatchInlineHook
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
        meta,
      )
    }
    return token
  }

  /**
   * @override
   * @see TokenizerParseInlineHook
   */
  public processToken(
    token: Token,
    children: YastNode[] | undefined,
    nodePoints: ReadonlyArray<NodePoint>,
  ): Node {
    const { content } = token

    // Backslash-escapes do not work inside autolink.
    let url = calcStringFromNodePoints(
      nodePoints,
      content.startIndex,
      content.endIndex,
    )

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
