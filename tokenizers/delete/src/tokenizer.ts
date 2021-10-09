import type { YastNode } from '@yozora/ast'
import { DeleteType } from '@yozora/ast'
import type { NodePoint } from '@yozora/character'
import { AsciiCodePoint, isWhitespaceCharacter } from '@yozora/character'
import type {
  MatchInlinePhaseApi,
  ResultOfProcessDelimiterPair,
  Tokenizer,
  TokenizerMatchInlineHook,
  TokenizerParseInlineHook,
  YastInlineToken,
} from '@yozora/core-tokenizer'
import {
  BaseInlineTokenizer,
  TokenizerPriority,
  eatOptionalCharacters,
} from '@yozora/core-tokenizer'
import type { Delimiter, Node, T, Token, TokenizerProps } from './types'
import { uniqueName } from './types'

/**
 * Lexical Analyzer for Delete.
 *
 * Strikethrough text is any text wrapped in two tildes (~).
 *
 * @see https://github.com/syntax-tree/mdast#delete
 * @see https://github.github.com/gfm/#strikethrough-extension-
 */
export class DeleteTokenizer
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
      priority: props.priority ?? TokenizerPriority.CONTAINING_INLINE,
    })
  }

  /**
   * @override
   * @see BaseInlineTokenizer
   */
  protected override _findDelimiter(
    startIndex: number,
    endIndex: number,
    api: Readonly<MatchInlinePhaseApi>,
  ): Delimiter | null {
    const nodePoints: ReadonlyArray<NodePoint> = api.getNodePoints()
    for (let i = startIndex; i < endIndex; ++i) {
      const c = nodePoints[i].codePoint
      switch (c) {
        // Escape backslash
        case AsciiCodePoint.BACKSLASH:
          i += 1
          break
        /**
         * Strike through text is any text wrapped in two tildes '~'
         * @see https://github.github.com/gfm/#strikethrough-extension-
         */
        case AsciiCodePoint.TILDE: {
          const _startIndex = i
          i = eatOptionalCharacters(nodePoints, i + 1, endIndex, c) - 1
          if (i - _startIndex !== 1) break

          let delimiterType: Delimiter['type'] = 'both'

          /**
           * If the preceding character is a whitespace, it cannot be used as a
           * closer delimiter
           */
          const preceding =
            _startIndex === startIndex ? null : nodePoints[_startIndex - 1]
          if (preceding != null && isWhitespaceCharacter(preceding.codePoint)) {
            delimiterType = 'opener'
          }

          /**
           * If the following character is a whitespace, it cannot be used as a
           * opener delimiter
           */
          const following = i + 1 === endIndex ? null : nodePoints[i + 1]
          if (following != null && isWhitespaceCharacter(following.codePoint)) {
            /**
             * If it can neither be used as a opener or closer delimiter, it
             * is not a valid delimiter
             */
            if (delimiterType !== 'both') break
            delimiterType = 'closer'
          }

          return {
            type: delimiterType,
            startIndex: _startIndex,
            endIndex: i + 1,
          }
        }
      }
    }
    return null
  }

  /**
   * @override
   * @see TokenizerMatchInlineHook
   */
  public processDelimiterPair(
    openerDelimiter: Delimiter,
    closerDelimiter: Delimiter,
    internalTokens: ReadonlyArray<YastInlineToken>,
    api: Readonly<MatchInlinePhaseApi>,
  ): ResultOfProcessDelimiterPair<T, Token, Delimiter> {
    // eslint-disable-next-line no-param-reassign
    internalTokens = api.resolveInternalTokens(
      internalTokens,
      openerDelimiter.endIndex,
      closerDelimiter.startIndex,
    )

    const token: Token = {
      nodeType: DeleteType,
      startIndex: openerDelimiter.startIndex,
      endIndex: closerDelimiter.endIndex,
      children: internalTokens,
    }
    return { tokens: [token] }
  }

  /**
   * @override
   * @see TokenizerParseInlineHook
   */
  public processToken(token: Token, children: YastNode[]): Node {
    const result: Node = {
      type: DeleteType,
      children,
    }
    return result
  }
}
