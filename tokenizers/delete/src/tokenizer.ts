import type { RootMeta as Meta, YastNode } from '@yozora/ast'
import { DeleteType } from '@yozora/ast'
import type { NodePoint } from '@yozora/character'
import { AsciiCodePoint, isWhitespaceCharacter } from '@yozora/character'
import type {
  ResultOfFindDelimiters,
  ResultOfProcessDelimiterPair,
  Tokenizer,
  TokenizerMatchInlineHook,
  TokenizerParseInlineHook,
  YastToken,
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
  implements
    Tokenizer<T>,
    TokenizerMatchInlineHook<T, Delimiter, Token, Meta>,
    TokenizerParseInlineHook<T, Token, Node, Meta> {
  public static readonly uniqueName: T = uniqueName
  public readonly name: T = uniqueName
  public readonly recognizedTypes: T[] = [uniqueName]
  public readonly getContext: Tokenizer['getContext'] = () => null

  public readonly delimiterGroup: string = uniqueName
  public readonly delimiterPriority: number = Number.MAX_SAFE_INTEGER

  /* istanbul ignore next */
  constructor(props: TokenizerProps = {}) {
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
          for (; i + 1 < endIndex; ++i) {
            if (nodePoints[i + 1].codePoint !== c) break
          }
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

          const delimiter: Delimiter = {
            type: delimiterType,
            startIndex: _startIndex,
            endIndex: i + 1,
          }
          return delimiter
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
    innerStates: YastToken[],
    nodePoints: ReadonlyArray<NodePoint>,
    meta: Readonly<Meta>,
  ): ResultOfProcessDelimiterPair<T, Token, Delimiter> {
    const context = this.getContext()
    if (context != null) {
      // eslint-disable-next-line no-param-reassign
      innerStates = context.resolveFallbackTokens(
        innerStates,
        openerDelimiter.endIndex,
        closerDelimiter.startIndex,
        nodePoints,
        meta,
      )
    }

    const token: Token = {
      type: this.name,
      startIndex: openerDelimiter.startIndex,
      endIndex: closerDelimiter.endIndex,
      children: innerStates,
    }
    return { token }
  }

  /**
   * @override
   * @see TokenizerParseInlineHook
   */
  public processToken(token: Token, children?: YastNode[]): Node {
    const result: Node = {
      type: DeleteType,
      children: children || [],
    }
    return result
  }
}
