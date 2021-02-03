import type {
  EnhancedYastNodePoint,
  YastMeta as M,
  YastNodeInterval,
} from '@yozora/tokenizercore'
import type {
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerParsePhaseHook,
  ResultOfFindDelimiters,
  YastInlineNode,
} from '@yozora/tokenizercore-inline'
import type {
  InlineCode as PS,
  InlineCodeMatchPhaseState as MS,
  InlineCodeTokenDelimiter as TD,
  InlineCodeType as T,
} from './types'
import { AsciiCodePoint } from '@yozora/character'
import { BaseInlineTokenizer } from '@yozora/tokenizercore-inline'
import { InlineCodeType } from './types'


/**
 * Params for constructing InlineCodeTokenizer
 */
export interface InlineCodeTokenizerProps {
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
 * Lexical Analyzer for PS
 */
export class InlineCodeTokenizer extends BaseInlineTokenizer implements
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook<T, M, MS, TD>,
  InlineTokenizerParsePhaseHook<T, M, MS, PS>
{
  public readonly name = 'InlineCodeTokenizer'
  public readonly delimiterGroup: string = 'InlineCodeTokenizer'
  public readonly recognizedTypes: T[] = [InlineCodeType]
  public readonly delimiterPriority: number = Number.MAX_SAFE_INTEGER

  public constructor(props: InlineCodeTokenizerProps = {}) {
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
  public * findDelimiter(
    initialStartIndex: number,
    endIndex: number,
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  ): ResultOfFindDelimiters<TD> {
    const potentialDelimiters: YastNodeInterval[] = []
    for (let i = initialStartIndex; i < endIndex; ++i) {
      const p = nodePoints[i]
      switch (p.codePoint) {
        case AsciiCodePoint.BACKSLASH:
          /**
           * Note that backslash escapes do not work in code spans.
           * All backslashes are treated literally
           * @see https://github.github.com/gfm/#example-348
           */
          if (
            i + 1 < endIndex &&
            nodePoints[i + 1].codePoint !== AsciiCodePoint.BACKTICK
          ) {
            i += 1
          }
          break
        /**
         * A backtick string is a string of one or more backtick characters '`'
         * that is neither preceded nor followed by a backtick.
         * A code span begins with a backtick string and ends with a
         * backtick string of equal length.
         * @see https://github.github.com/gfm/#backtick-string
         * @see https://github.github.com/gfm/#code-span
         */
        case AsciiCodePoint.BACKTICK: {
          const _startIndex = i

          // matched as many backtick as possible
          for (; i + 1 < endIndex; ++i) {
            if (nodePoints[i + 1].codePoint !== p.codePoint) break
          }

          const delimiter: YastNodeInterval = {
            startIndex: _startIndex,
            endIndex: i + 1,
          }
          potentialDelimiters.push(delimiter)
          break
        }
      }
    }

    let pIndex = 0, startIndex = initialStartIndex
    while (pIndex < potentialDelimiters.length) {
      for (; pIndex < potentialDelimiters.length; ++pIndex) {
        const delimiter = potentialDelimiters[pIndex]
        if (delimiter.startIndex >= startIndex) break
      }
      if (pIndex + 1 >= potentialDelimiters.length) break

      const openerDelimiter = potentialDelimiters[pIndex]
      const thickness = openerDelimiter.endIndex - openerDelimiter.startIndex
      let closerDelimiter: YastNodeInterval | null = null

      for (let i = pIndex + 1; i < potentialDelimiters.length; ++i) {
        const delimiter = potentialDelimiters[i]
        if (delimiter.endIndex - delimiter.startIndex === thickness) {
          closerDelimiter = delimiter
          break
        }
      }

      // No matched inlineCode closer marker found, try next one.
      if (closerDelimiter == null) {
        pIndex += 1
        continue
      }

      const delimiter: TD = {
        type: 'full',
        startIndex: openerDelimiter.startIndex,
        endIndex: closerDelimiter.endIndex,
        thickness,
      }
      startIndex = yield delimiter
    }
    return null
  }

  /**
   * @override
   * @see InlineTokenizerMatchPhaseHook
   */
  public processFullDelimiter(
    fullDelimiter: TD,
  ): MS | null {
    const state: MS = {
      type: InlineCodeType,
      startIndex: fullDelimiter.startIndex,
      endIndex: fullDelimiter.endIndex,
      thickness: fullDelimiter.thickness,
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
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  ): PS {
    let startIndex: number = matchPhaseState.startIndex + matchPhaseState.thickness
    let endIndex: number = matchPhaseState.endIndex - matchPhaseState.thickness

    let isAllSpace = true
    for (let i = startIndex; i < endIndex; ++i) {
      if (isSpaceLike(nodePoints[i])) continue
      isAllSpace = false
      break
    }

    /**
     * If the resulting string both begins and ends with a space character,
     * but doesn't consist entirely of space characters, a single space
     * character is removed from the front and back. This allows you to
     * include code that begins or endsWith backtick characters, which must
     * be separated by whitespace from theopening or closing backtick strings.
     * @see https://github.github.com/gfm/#example-340
     *
     * Only spaces, and not unicode whitespace in general, are stripped
     * in this way
     * @see https://github.github.com/gfm/#example-343
     *
     * No stripping occurs if the code span contains only spaces
     * @see https://github.github.com/gfm/#example-344
     */
    if (!isAllSpace && startIndex + 2 < endIndex) {
      const firstCharacter = nodePoints[startIndex]
      const lastCharacter = nodePoints[endIndex - 1]
      if (isSpaceLike(firstCharacter) && isSpaceLike(lastCharacter)) {
        startIndex += 1
        endIndex -= 1
      }
    }

    const result: PS = {
      type: InlineCodeType,
      value: nodePoints.slice(startIndex, endIndex)
        .map(c => (isSpaceLike(c) ? ' ' : String.fromCodePoint(c.codePoint)))
        .join(''),
    }
    return result
  }
}

/**
 * Line endings are treated like spaces
 * @see https://github.github.com/gfm/#example-345
 * @see https://github.github.com/gfm/#example-346
 */
function isSpaceLike(c: EnhancedYastNodePoint): boolean {
  return (
    c.codePoint === AsciiCodePoint.SPACE ||
    c.codePoint === AsciiCodePoint.LF
  )
}
