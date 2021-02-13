import type { Autolink as Node } from '@yozora/tokenizer-autolink'
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
  AutolinkExtensionContentType,
  AutolinkExtensionToken as Token,
  AutolinkExtensionTokenDelimiter as Delimiter,
} from './types'
import { AsciiCodePoint, calcStringFromNodePoints } from '@yozora/character'
import { NodePoint, isWhitespaceCharacter } from '@yozora/character'
import { AutolinkType } from '@yozora/tokenizer-autolink'
import { AutolinkExtensionType } from './types'
import { eatExtendEmailAddress } from './util/email'
import { eatExtendedUrl, eatWWWDomain } from './util/uri'


type T = AutolinkType | AutolinkExtensionType


/**
 * Params for constructing AutolinkExtensionTokenizer
 */
export interface AutolinkExtensionTokenizerProps {
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
type ContentHelper = {
  contentType: AutolinkExtensionContentType
  eat: ContentEater
}


const helpers: ReadonlyArray<ContentHelper> = [
  { contentType: 'uri', eat: eatExtendedUrl },
  { contentType: 'uri-www', eat: eatWWWDomain },
  { contentType: 'email', eat: eatExtendEmailAddress },
]


/**
 * Lexical Analyzer for Autolink
 *
 * @see https://github.github.com/gfm/#autolinks-extension-
 */
export class AutolinkExtensionTokenizer implements
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook<T, Meta, Token, Delimiter>,
  InlineTokenizerParsePhaseHook<T, Meta, Token, Node> {
  public readonly name: string = AutolinkExtensionTokenizer.name
  public readonly getContext: InlineTokenizer['getContext'] = () => null

  public readonly delimiterGroup: string = 'AutolinkExtensionTokenizer'
  public readonly recognizedTypes: T[] = [AutolinkExtensionType]
  public readonly delimiterPriority: number = Number.MAX_SAFE_INTEGER

  /* istanbul ignore next */
  public constructor(props: AutolinkExtensionTokenizerProps = {}) {
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
  public * findDelimiter(
    initialStartIndex: number,
    endIndex: number,
    nodePoints: ReadonlyArray<NodePoint>,
  ): ResultOfFindDelimiters<Delimiter> {
    const findDelimiter = (startIndex: number): ResultOfFindDelimiters<Delimiter> => {
      for (let i = startIndex; i < endIndex; ++i) {
        /**
         * Autolinks can also be constructed without requiring the use of '<' and
         * to '>' to delimit them, although they will be recognized under a
         * smaller set of circumstances. All such recognized autolinks can only
         * come at the beginning of a line, after whitespace, or any of the
         * delimiting characters '*', '_', '~', and '('.
         * @see https://github.github.com/gfm/#autolinks-extension-
         */
        {
          let j = i
          for (; j < endIndex; ++j) {
            const c = nodePoints[j].codePoint
            if (
              isWhitespaceCharacter(c) ||
              c === AsciiCodePoint.ASTERISK ||
              c === AsciiCodePoint.UNDERSCORE ||
              c === AsciiCodePoint.TILDE ||
              c === AsciiCodePoint.OPEN_PARENTHESIS
            ) continue
            break
          }

          if (j >= endIndex) break
          if (j === i && i > initialStartIndex) continue
          i = j
        }

        let nextIndex: number = endIndex
        let contentType: AutolinkExtensionContentType | null = null
        for (const helper of helpers) {
          const eatResult = helper.eat(nodePoints, i, endIndex)
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

        if (nextIndex <= endIndex) {
          const delimiter: Delimiter = {
            type: 'full',
            startIndex: i,
            endIndex: nextIndex,
            contentType,
            content: {
              startIndex: i,
              endIndex: nextIndex,
            }
          }
          return delimiter
        }
        i = nextIndex - 1
      }
      return null
    }

    let startIndex: number | null = initialStartIndex
    while (startIndex != null) {
      const result = findDelimiter(startIndex)
      if (result == null) return null
      startIndex = yield result
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
      type: AutolinkExtensionType,
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

    switch (token.contentType) {
      // Add 'mailto:' prefix to email address type autolink.
      case 'email':
        url = 'mailto:' + url
        break
      // Add 'http://' prefix to email address type autolink.
      case 'uri-www':
        url = 'http://' + url
        break
    }

    const result: Node = {
      type: AutolinkType,
      url,
      children: children || [],
    }
    return result
  }
}
