import type { Autolink as PS } from '@yozora/tokenizer-autolink'
import type {
  ResultOfRequiredEater,
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
  AutolinkExtensionContentType,
  AutolinkExtensionMatchPhaseState as MS,
  AutolinkExtensionTokenDelimiter as TD,
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
  InlineTokenizerMatchPhaseHook<T, M, MS, TD>,
  InlineTokenizerParsePhaseHook<T, M, MS, PS> {
  public readonly name = 'AutolinkExtensionTokenizer'
  public readonly getContext: InlineTokenizer['getContext'] = () => null

  public readonly delimiterGroup: string = 'AutolinkExtensionTokenizer'
  public readonly recognizedTypes: T[] = [AutolinkExtensionType]
  public readonly delimiterPriority: number = Number.MAX_SAFE_INTEGER

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
  public findDelimiter(
    startIndex: number,
    endIndex: number,
    nodePoints: ReadonlyArray<NodePoint>,
  ): ResultOfFindDelimiters<TD> {
    for (let i = startIndex; i < endIndex; ++i) {
      /**
       * Autolinks can also be constructed without requiring the use of '<' and
       * to '>' to delimit them, although they will be recognized under a
       * smaller set of circumstances. All such recognized autolinks can only
       * come at the beginning of a line, after whitespace, or any of the
       * delimiting characters '*', '_', '~', and '('.
       * @see https://github.github.com/gfm/#autolinks-extension-
       */
      if (i > startIndex) {
        if (i + 1 >= endIndex) break

        const c = nodePoints[i].codePoint
        if (
          !isWhitespaceCharacter(c) &&
          c !== AsciiCodePoint.ASTERISK &&
          c !== AsciiCodePoint.UNDERSCORE &&
          c !== AsciiCodePoint.TILDE &&
          c !== AsciiCodePoint.OPEN_PARENTHESIS
        ) continue

        i += 1
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
        const delimiter: TD = {
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

  /**
   * @override
   * @see InlineTokenizerMatchPhaseHoo
   */
  public processFullDelimiter(
    fullDelimiter: TD,
    nodePoints: ReadonlyArray<NodePoint>,
    meta: Readonly<M>,
  ): ResultOfProcessFullDelimiter<T, MS> {
    const state: MS = {
      type: AutolinkExtensionType,
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
    nodePoints: ReadonlyArray<NodePoint>,
  ): PS {
    const { content } = matchPhaseState

    // Backslash-escapes do not work inside autolink.
    let url = calcStringFromNodePoints(
      nodePoints, content.startIndex, content.endIndex)

    switch (matchPhaseState.contentType) {
      // Add 'mailto:' prefix to email address type autolink.
      case 'email':
        url = 'mailto:' + url
        break
      // Add 'http://' prefix to email address type autolink.
      case 'uri-www':
        url = 'http://' + url
        break
    }

    const result: PS = {
      type: AutolinkType,
      url,
      children: parsedChildren || [],
    }
    return result
  }
}
