import type { NodePoint } from '@yozora/character'
import type { YastMeta as M } from '@yozora/tokenizercore'
import type {
  InlineTokenDelimiter,
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerParsePhaseHook,
  ResultOfFindDelimiters,
  YastInlineNode,
} from '@yozora/tokenizercore-inline'
import type {
  InlineFormula as PS,
  InlineFormulaMatchPhaseState as MS,
  InlineFormulaTokenDelimiter as TD,
  InlineFormulaType as T,
} from './types'
import { AsciiCodePoint } from '@yozora/character'
import { InlineFormulaType } from './types'


/**
 * Params for constructing InlineFormulaTokenizer
 */
export interface InlineFormulaTokenizerProps {
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
export class InlineFormulaTokenizer implements
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook<T, M, MS, TD>,
  InlineTokenizerParsePhaseHook<T, M, MS, PS>
{
  public readonly name = 'InlineFormulaTokenizer'
  public readonly getContext: InlineTokenizer['getContext'] = () => null

  public readonly delimiterGroup: string = 'InlineFormulaTokenizer'
  public readonly recognizedTypes: T[] = [InlineFormulaType]
  public readonly delimiterPriority: number = Number.MAX_SAFE_INTEGER

  public constructor(props: InlineFormulaTokenizerProps = {}) {
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
    nodePoints: ReadonlyArray<NodePoint>,
  ): ResultOfFindDelimiters<TD> {
    const potentialDelimiters: InlineTokenDelimiter[] = []
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
            nodePoints[i + 1].codePoint !== AsciiCodePoint.DOLLAR_SIGN
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
         *
         * the left flanking string pattern is: <BACKTICK STRING><DOLLAR_SIGN>.
         * eg: `$, ``$
         *
         * A backtick string is a string of one or more backtick
         * characters '`' that is neither preceded nor followed by a backtick.
         * @see https://github.github.com/gfm/#backtick-string
         */
        case AsciiCodePoint.BACKTICK: {
          const _startIndex = i

          // matched as many backtick as possible
          for (i += 1; i < endIndex; ++i) {
            if (nodePoints[i].codePoint !== AsciiCodePoint.BACKTICK) break
          }

          // No dollar character found after backtick string
          if (
            i >= endIndex ||
            nodePoints[i].codePoint !== AsciiCodePoint.DOLLAR_SIGN
          ) {
            break
          }

          const delimiter: InlineTokenDelimiter = {
            type: 'opener',
            startIndex: _startIndex,
            endIndex: i + 1,
          }
          potentialDelimiters.push(delimiter)
          break
        }
        /**
         * the right flanking string pattern is: <DOLLAR_SIGN><BACKTICK STRING>.
         * eg: $`, $``
         *
         * A backtick string is a string of one or more backtick characters '`'
         * that is neither preceded nor followed by a backtick.
         * @see https://github.github.com/gfm/#backtick-string
         */
        case AsciiCodePoint.DOLLAR_SIGN: {
          // matched as many backtick as possible
          const _startIndex = i
          for (i += 1; i < endIndex; ++i) {
            if (nodePoints[i].codePoint !== AsciiCodePoint.BACKTICK) break
          }
          const thickness: number = i - _startIndex

          // No backtick character found after dollar
          if (thickness <= 1) break

          const delimiter: InlineTokenDelimiter = {
            type: 'closer',
            startIndex: _startIndex,
            endIndex: i,
          }
          potentialDelimiters.push(delimiter)
          i -= 1
          break
        }
      }
    }

    let pIndex = 0, startIndex = initialStartIndex
    while (pIndex < potentialDelimiters.length) {
      for (; pIndex < potentialDelimiters.length; ++pIndex) {
        const delimiter = potentialDelimiters[pIndex]
        if (
          delimiter.startIndex >= startIndex &&
          delimiter.type === 'opener'
        ) break
      }
      if (pIndex + 1 >= potentialDelimiters.length) break

      const openerDelimiter = potentialDelimiters[pIndex]
      const thickness = openerDelimiter.endIndex - openerDelimiter.startIndex
      let closerDelimiter: InlineTokenDelimiter | null = null

      for (let i = pIndex + 1; i < potentialDelimiters.length; ++i) {
        const delimiter = potentialDelimiters[i]
        if (
          delimiter.type === 'closer' &&
          delimiter.endIndex - delimiter.startIndex === thickness
        ) {
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

  /**
   * @override
   * @see InlineTokenizerMatchPhaseHook
   */
  public processFullDelimiter(
    fullDelimiter: TD,
  ): MS | null {
    const state: MS = {
      type: InlineFormulaType,
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
    nodePoints: ReadonlyArray<NodePoint>,
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
      type: InlineFormulaType,
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
function isSpaceLike(c: NodePoint): boolean {
  return (
    c.codePoint === AsciiCodePoint.SPACE ||
    c.codePoint === AsciiCodePoint.LF
  )
}
