import { LinkType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import { AsciiCodePoint, calcStringFromNodePoints } from '@yozora/character'
import type {
  IInlineTokenizer,
  IMatchInlineHookCreator,
  IParseInlineHookCreator,
  IResultOfProcessSingleDelimiter,
} from '@yozora/core-tokenizer'
import {
  BaseInlineTokenizer,
  TokenizerPriority,
  encodeLinkDestination,
  genFindDelimiter,
} from '@yozora/core-tokenizer'
import type {
  AutolinkContentType,
  IContentHelper,
  IDelimiter,
  INode,
  IToken,
  ITokenizerProps,
  T,
} from './types'
import { uniqueName } from './types'
import { eatEmailAddress } from './util/email'
import { eatAbsoluteUri } from './util/uri'

const helpers: ReadonlyArray<IContentHelper> = [
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
  extends BaseInlineTokenizer<T, IDelimiter, IToken, INode>
  implements IInlineTokenizer<T, IDelimiter, IToken, INode>
{
  /* istanbul ignore next */
  constructor(props: ITokenizerProps = {}) {
    super({
      name: props.name ?? uniqueName,
      /**
       * Autolink has the same priority as inline-code.
       * @see https://github.github.com/gfm/#example-355
       * @see https://github.github.com/gfm/#example-356
       */
      priority: props.priority ?? TokenizerPriority.ATOMIC,
    })
  }

  public override readonly match: IMatchInlineHookCreator<T, IDelimiter, IToken> = api => {
    return {
      findDelimiter: () => genFindDelimiter<IDelimiter>(_findDelimiter),
      processSingleDelimiter,
    }

    function _findDelimiter(startIndex: number, endIndex: number): IDelimiter | null {
      const nodePoints: ReadonlyArray<INodePoint> = api.getNodePoints()

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
          return {
            type: 'full',
            startIndex: i,
            endIndex: nextIndex + 1,
            contentType,
          }
        }
        i = nextIndex - 1
      }
      return null
    }

    function processSingleDelimiter(
      delimiter: IDelimiter,
    ): IResultOfProcessSingleDelimiter<T, IToken> {
      const token: IToken = {
        nodeType: LinkType,
        startIndex: delimiter.startIndex,
        endIndex: delimiter.endIndex,
        contentType: delimiter.contentType,
        children: api.resolveFallbackTokens([], delimiter.startIndex + 1, delimiter.endIndex - 1),
      }
      return [token]
    }
  }

  public override readonly parse: IParseInlineHookCreator<T, IToken, INode> = api => ({
    parse: (token, children) => {
      const nodePoints: ReadonlyArray<INodePoint> = api.getNodePoints()

      // Backslash-escapes do not work inside autolink.
      let url = calcStringFromNodePoints(nodePoints, token.startIndex + 1, token.endIndex - 1)

      // Add 'mailto:' prefix to email address type autolink.
      if (token.contentType === 'email') {
        url = 'mailto:' + url
      }

      const encodedUrl = encodeLinkDestination(url)
      const result: INode = {
        type: LinkType,
        url: encodedUrl,
        children,
      }
      return result
    },
  })
}
