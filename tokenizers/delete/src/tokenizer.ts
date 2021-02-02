import type {
  EnhancedYastNodePoint,
  YastMeta as M,
} from '@yozora/tokenizercore'
import type {
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerParsePhaseHook,
  ResultOfFindDelimiters,
  ResultOfProcessDelimiter,
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


/**
 * Params for constructing DeleteTokenizer
 */
export interface DeleteTokenizerProps {
  /**
   * Delimiter group identity.
   */
  readonly delimiterGroup?: string
  /**
   * Delimiter priority.
   */
  readonly delimiterPriority?: number
}


/**
 * Lexical Analyzer for Delete
 */
export class DeleteTokenizer extends BaseInlineTokenizer implements
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook<T, M, MS, TD>,
  InlineTokenizerParsePhaseHook<T, M, MS, PS>
{
  public readonly name = 'DeleteTokenizer'
  public readonly delimiterGroup: string = 'DeleteTokenizer'
  public readonly recognizedTypes: T[] = [DeleteType]
  public readonly delimiterPriority: number = -1

  public constructor(props: DeleteTokenizerProps = {}) {
    super()
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
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  ): ResultOfFindDelimiters<TD> {
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
      case AsciiCodePoint.TILDE:
        const _startIndex = i
        for (; i + 1 < endIndex; ++i) {
          if (nodePoints[i + 1].codePoint !== c) break
        }
        if (i - _startIndex !== 1) break

        let delimiterType: TD['type'] = 'both'

        /**
         * If the preceding character is a whitespace, it cannot be used as a
         * closer delimiter
         */
        const preceding = (_startIndex === startIndex)
          ? null
          : nodePoints[_startIndex - 1]
        if (preceding != null && isWhiteSpaceCharacter(preceding.codePoint)) {
          delimiterType = 'opener'
        }

        /**
         * If the following character is a whitespace, it cannot be used as a
         * opener delimiter
         */
        const following = (i + 1 === endIndex) ? null : nodePoints[i + 1]
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
        return delimiter
      }
    }
    return null
  }

  /**
   * @override
   * @see InlineTokenizerMatchPhaseHook
   */
  public processDelimiter(
    openerDelimiter: TD,
    closerDelimiter: TD,
    innerStates: InlineTokenizerMatchPhaseState[],
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    meta: Readonly<M>,
  ): ResultOfProcessDelimiter<T, MS, TD> {
    const context = this.getContext()
    if (context != null) {
      // eslint-disable-next-line no-param-reassign
      innerStates = context.resolveFallbackStates(
        innerStates,
        openerDelimiter.endIndex,
        closerDelimiter.startIndex,
        nodePoints,
        meta
      )
    }

    const state: MS = {
      type: DeleteType,
      startIndex: openerDelimiter.startIndex,
      endIndex: closerDelimiter.endIndex,
      children: innerStates,
    }
    return { status: 'paired', state }
  }

  /**
   * @override
   * @see InlineTokenizerParsePhaseHook
   */
  public parse(matchPhaseState: MS, parsedChildren?: YastInlineNode[]): PS {
    const result: PS = {
      type: DeleteType,
      children: parsedChildren || [],
    }
    return result
  }
}
