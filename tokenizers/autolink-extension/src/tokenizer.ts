import type { YastNode } from '@yozora/ast'
import { LinkType } from '@yozora/ast'
import type { NodePoint } from '@yozora/character'
import {
  AsciiCodePoint,
  calcStringFromNodePoints,
  isWhitespaceCharacter,
} from '@yozora/character'
import type {
  MatchInlinePhaseApi,
  ResultOfProcessSingleDelimiter,
  Tokenizer,
  TokenizerMatchInlineHook,
  TokenizerParseInlineHook,
} from '@yozora/core-tokenizer'
import { BaseInlineTokenizer, TokenizerPriority } from '@yozora/core-tokenizer'
import type {
  AutolinkExtensionContentType,
  ContentHelper,
  Delimiter,
  Node,
  T,
  Token,
  TokenizerProps,
} from './types'
import { uniqueName } from './types'
import { eatExtendEmailAddress } from './util/email'
import { eatExtendedUrl, eatWWWDomain } from './util/uri'

const helpers: ReadonlyArray<ContentHelper> = [
  { contentType: 'uri', eat: eatExtendedUrl },
  { contentType: 'uri-www', eat: eatWWWDomain },
  { contentType: 'email', eat: eatExtendEmailAddress },
]

/**
 * Lexical Analyzer for Autolink (extension).
 *
 * @see https://github.github.com/gfm/#autolinks-extension-
 */
export class AutolinkExtensionTokenizer
  extends BaseInlineTokenizer<Delimiter>
  implements
    Tokenizer,
    TokenizerMatchInlineHook<T, Delimiter, Token>,
    TokenizerParseInlineHook<T, Token, Node>
{
  /* istanbul ignore next */
  constructor(props: TokenizerProps = {}) {
    super({
      name: props.name ?? uniqueName,
      /**
       * Autolink has the same priority as links.
       * @see https://github.github.com/gfm/#example-509
       */
      priority: props.priority ?? TokenizerPriority.LINKS,
    })
  }

  /**
   * @override
   * @see TokenizerMatchInlineHook
   */
  protected override _findDelimiter(
    startIndex: number,
    endIndex: number,
    nodePoints: ReadonlyArray<NodePoint>,
    api: Readonly<MatchInlinePhaseApi>,
  ): Delimiter | null {
    const blockStartIndex = api.getBlockStartIndex()
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
        let flag = false
        for (; j < endIndex; ++j) {
          const c = nodePoints[j].codePoint
          if (
            isWhitespaceCharacter(c) ||
            c === AsciiCodePoint.ASTERISK ||
            c === AsciiCodePoint.UNDERSCORE ||
            c === AsciiCodePoint.TILDE ||
            c === AsciiCodePoint.OPEN_PARENTHESIS
          ) {
            flag = true
            continue
          }

          if (flag || j === blockStartIndex) break
          flag = false
        }

        if (j >= endIndex) break
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
        return {
          type: 'full',
          startIndex: i,
          endIndex: nextIndex,
          contentType,
        }
      }
      i = nextIndex - 1
    }
    return null
  }

  /**
   * @override
   * @see TokenizerMatchInlineHook
   */
  public processSingleDelimiter(
    delimiter: Delimiter,
    nodePoints: ReadonlyArray<NodePoint>,
    api: Readonly<MatchInlinePhaseApi>,
  ): ResultOfProcessSingleDelimiter<T, Token> {
    const token: Token = {
      nodeType: LinkType,
      startIndex: delimiter.startIndex,
      endIndex: delimiter.endIndex,
      contentType: delimiter.contentType,
      children: api.resolveFallbackInlineTokens(
        [],
        delimiter.startIndex,
        delimiter.endIndex,
        nodePoints,
      ),
    }
    return [token]
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
    // Backslash-escapes do not work inside autolink.
    let url = calcStringFromNodePoints(
      nodePoints,
      token.startIndex,
      token.endIndex,
    )

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
      type: LinkType,
      url,
      children: children ?? [],
    }
    return result
  }
}
