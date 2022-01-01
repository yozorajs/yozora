import type { IYastNode } from '@yozora/ast'
import { DeleteType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import { AsciiCodePoint, isWhitespaceCharacter } from '@yozora/character'
import type {
  IMatchInlinePhaseApi,
  IResultOfProcessDelimiterPair,
  ITokenizer,
  ITokenizerMatchInlineHook,
  ITokenizerParseInlineHook,
  IYastInlineToken,
} from '@yozora/core-tokenizer'
import {
  BaseInlineTokenizer,
  TokenizerPriority,
  eatOptionalCharacters,
} from '@yozora/core-tokenizer'
import type { IDelimiter, INode, IToken, ITokenizerProps, T } from './types'
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
  extends BaseInlineTokenizer<IDelimiter>
  implements
    ITokenizer,
    ITokenizerMatchInlineHook<T, IDelimiter, IToken>,
    ITokenizerParseInlineHook<T, IToken, INode>
{
  /* istanbul ignore next */
  constructor(props: ITokenizerProps = {}) {
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
    api: Readonly<IMatchInlinePhaseApi>,
  ): IDelimiter | null {
    const nodePoints: ReadonlyArray<INodePoint> = api.getNodePoints()
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

          let delimiterType: IDelimiter['type'] = 'both'

          /**
           * If the preceding character is a whitespace, it cannot be used as a
           * closer delimiter
           */
          const preceding = _startIndex === startIndex ? null : nodePoints[_startIndex - 1]
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
   * @see ITokenizerMatchInlineHook
   */
  public processDelimiterPair(
    openerDelimiter: IDelimiter,
    closerDelimiter: IDelimiter,
    internalTokens: ReadonlyArray<IYastInlineToken>,
    api: Readonly<IMatchInlinePhaseApi>,
  ): IResultOfProcessDelimiterPair<T, IToken, IDelimiter> {
    // eslint-disable-next-line no-param-reassign
    internalTokens = api.resolveInternalTokens(
      internalTokens,
      openerDelimiter.endIndex,
      closerDelimiter.startIndex,
    )

    const token: IToken = {
      nodeType: DeleteType,
      startIndex: openerDelimiter.startIndex,
      endIndex: closerDelimiter.endIndex,
      children: internalTokens,
    }
    return { tokens: [token] }
  }

  /**
   * @override
   * @see ITokenizerParseInlineHook
   */
  public parseInline(token: IToken, children: IYastNode[]): INode {
    const result: INode = {
      type: DeleteType,
      children,
    }
    return result
  }
}
