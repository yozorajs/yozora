import type { NodePoint } from '@yozora/character'
import type { YastMeta as Meta, YastNode } from '@yozora/tokenizercore'
import type {
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerParsePhaseHook,
  ResultOfFindDelimiters,
  ResultOfProcessDelimiterPair,
  YastToken,
} from '@yozora/tokenizercore-inline'
import type {
  Delete as Node,
  DeleteToken as Token,
  DeleteTokenDelimiter as Delimiter,
  DeleteType as T,
} from './types'
import { AsciiCodePoint, isWhitespaceCharacter } from '@yozora/character'
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
export class DeleteTokenizer implements
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook<T, Meta, Token, Delimiter>,
  InlineTokenizerParsePhaseHook<T, Meta, Token, Node>
{
  public readonly name = 'DeleteTokenizer'
  public readonly getContext: InlineTokenizer['getContext'] = () => null

  public readonly delimiterGroup: string = 'DeleteTokenizer'
  public readonly recognizedTypes: T[] = [DeleteType]
  public readonly delimiterPriority: number = Number.MAX_SAFE_INTEGER

  public constructor(props: DeleteTokenizerProps = {}) {
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
      case AsciiCodePoint.TILDE:
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
        const preceding = (_startIndex === startIndex)
          ? null
          : nodePoints[_startIndex - 1]
        if (preceding != null && isWhitespaceCharacter(preceding.codePoint)) {
          delimiterType = 'opener'
        }

        /**
         * If the following character is a whitespace, it cannot be used as a
         * opener delimiter
         */
        const following = (i + 1 === endIndex) ? null : nodePoints[i + 1]
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
    return null
  }

  /**
   * @override
   * @see InlineTokenizerMatchPhaseHook
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
        meta
      )
    }

    const token: Token = {
      type: DeleteType,
      startIndex: openerDelimiter.startIndex,
      endIndex: closerDelimiter.endIndex,
      children: innerStates,
    }
    return { token }
  }

  /**
   * @override
   * @see InlineTokenizerParsePhaseHook
   */
  public processToken(token: Token, children?: YastNode[]): Node {
    const result: Node = {
      type: DeleteType,
      children: children || [],
    }
    return result
  }
}
