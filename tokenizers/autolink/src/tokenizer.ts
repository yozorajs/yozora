import type { RootMeta as Meta, YastNode } from '@yozora/ast'
import { LinkType } from '@yozora/ast'
import type { NodePoint } from '@yozora/character'
import { AsciiCodePoint, calcStringFromNodePoints } from '@yozora/character'
import type {
  ResultOfFindDelimiters,
  ResultOfProcessFullDelimiter,
  Tokenizer,
  TokenizerMatchInlineHook,
  TokenizerParseInlineHook,
} from '@yozora/core-tokenizer'
import { BaseTokenizer, encodeLinkDestination } from '@yozora/core-tokenizer'
import type {
  AutolinkContentType,
  ContentHelper,
  Delimiter,
  Node,
  T,
  Token,
  TokenizerProps,
} from './types'
import { uniqueName } from './types'
import { eatEmailAddress } from './util/email'
import { eatAbsoluteUri } from './util/uri'

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
  extends BaseTokenizer
  implements
    Tokenizer,
    TokenizerMatchInlineHook<T, Delimiter, Token, Meta>,
    TokenizerParseInlineHook<T, Token, Node, Meta> {
  public readonly delimiterGroup: string

  /* istanbul ignore next */
  constructor(props: TokenizerProps = {}) {
    super({
      name: uniqueName,
      priority: props.priority,
    })
    this.delimiterGroup = props.delimiterGroup ?? this.name
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
      nodeType: LinkType,
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
      type: LinkType,
      url: encodedUrl,
      children: children || [],
    }
    return result
  }
}
