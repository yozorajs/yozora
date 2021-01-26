import type {
  EnhancedYastNodePoint,
  YastMeta as M,
} from '@yozora/tokenizercore'
import type {
  InlinePotentialToken,
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerParsePhaseHook,
  InlineTokenizerProps,
  ResultOfEatDelimiters,
  ResultOfEatPotentialTokens,
  YastInlineNode,
} from '@yozora/tokenizercore-inline'
import type {
  Delete as PS,
  DeleteMatchPhaseState as MS,
  DeleteTokenDelimiter as TD,
  DeleteType as T,
} from './types'
import { AsciiCodePoint, isWhiteSpaceCharacter } from '@yozora/character'
import { BaseInlineTokenizer } from '@yozora/tokenizercore-inline'
import { DeleteType } from './types'


type PT = InlinePotentialToken<T>


/**
 * Lexical Analyzer for Delete
 */
export class DeleteTokenizer extends BaseInlineTokenizer<T> implements
  InlineTokenizer<T>,
  InlineTokenizerMatchPhaseHook<T, M, MS, TD>,
  InlineTokenizerParsePhaseHook<T, M, MS, PS>
{
  public readonly name = 'DeleteTokenizer'
  public readonly uniqueTypes: T[] = [DeleteType]

  public constructor(props: InlineTokenizerProps) {
    super({ ...props })
  }

  /**
   * @override
   * @see InlineTokenizerMatchPhaseHook
   */
  public * eatDelimiters(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  ): ResultOfEatDelimiters<TD> {
    const delimiters: TD[] = []
    while (true) {
      const nextParams = yield
      if (nextParams == null) break

      const {
        startIndex,
        endIndex,
        precedingCodePosition,
        followingCodePosition,
      } = nextParams

      for (let i = startIndex; i < endIndex; ++i) {
        const p = nodePoints[i]
        switch (p.codePoint) {
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
              if (nodePoints[i + 1].codePoint !== p.codePoint) break
            }
            if (i - _startIndex !== 1) break

            let delimiterType: TD['type'] = 'both'

            /**
             * If the preceding character is a whitespace, it cannot be used as a
             * closer delimiter
             */
            const preceding = (_startIndex === startIndex)
              ? precedingCodePosition
              : nodePoints[_startIndex - 1]
            if (preceding != null && isWhiteSpaceCharacter(preceding.codePoint)) {
              delimiterType = 'opener'
            }

            /**
             * If the following character is a whitespace, it cannot be used as a
             * opener delimiter
             */
            const following = (i + 1 === endIndex)
              ? followingCodePosition
              : nodePoints[i + 1]
            if (following != null && isWhiteSpaceCharacter(following.codePoint)) {
              /**
               * If it can neither be used as a opener or closer delimiter, it
               * is not a valid delimiter
               */
              if (delimiterType !== 'both') break
              delimiterType = 'closer'
            }

            const delimiter: TD = {
              type: delimiterType,
              startIndex: _startIndex,
              endIndex: i + 1,
            }
            delimiters.push(delimiter)
            break
          }
        }
      }
    }
    return delimiters
  }

  /**
   * @override
   * @see InlineTokenizerMatchPhaseHook
   */
  public eatPotentialTokens(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    meta: Readonly<M>,
    delimiters: TD[],
  ): ResultOfEatPotentialTokens<T> {
    const results: PT[] = []
    for (let opener: TD | null = null, i = 0; i < delimiters.length; ++i) {
      const delimiter = delimiters[i]
      switch (delimiter.type) {
        case 'opener':
          opener = delimiter
          break
        case 'both':
          if (opener == null) {
            opener = delimiter
            break
          }
        case 'closer': {
          if (opener == null) break
          const closer = delimiter

          const state: MS = {
            type: DeleteType,
            openerDelimiter: opener,
            closerDelimiter: closer,
          }
          results.push({
            state,
            startIndex: opener.startIndex,
            endIndex: closer.endIndex,
            innerRawContents: [{
              startIndex: opener.endIndex,
              endIndex: closer.startIndex,
            }]
          })
          opener = null
          break
        }
      }
    }
    return results
  }

  /**
   * @override
   * @see InlineTokenizerParsePhaseHook
   */
  public parse(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    meta: Readonly<M>,
    matchPhaseState: MS,
    parsedChildren?: YastInlineNode[],
  ): PS {
    const result: PS = {
      type: DeleteType,
      children: parsedChildren || [],
    }
    return result
  }
}
