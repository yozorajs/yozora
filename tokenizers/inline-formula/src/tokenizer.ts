import type { CodePoint, NodePoint } from '@yozora/character'
import type {
  ResultOfFindDelimiters,
  Tokenizer,
  TokenizerMatchInlineHook,
  TokenizerParseInlineHook,
  YastMeta as Meta,
  YastNode,
  YastTokenDelimiter,
} from '@yozora/tokenizercore'
import type {
  InlineFormula as Node,
  InlineFormulaToken as Token,
  InlineFormulaTokenDelimiter as Delimiter,
  InlineFormulaType as T,
} from './types'
import {
  AsciiCodePoint,
  calcStringFromNodePoints,
  isLineEnding,
  isSpaceCharacter,
} from '@yozora/character'
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
 * Lexical Analyzer for inlineFormula.
 */
export class InlineFormulaTokenizer implements
  Tokenizer,
  TokenizerMatchInlineHook<T, Meta, Token, Delimiter>,
  TokenizerParseInlineHook<T, Meta, Token, Node>
{
  public readonly name: string = InlineFormulaTokenizer.name
  public readonly getContext: Tokenizer['getContext'] = () => null

  public readonly delimiterGroup: string = InlineFormulaTokenizer.name
  public readonly delimiterPriority: number = Number.MAX_SAFE_INTEGER
  public readonly recognizedTypes: T[] = [InlineFormulaType]

  /* istanbul ignore next */
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
   * @see TokenizerMatchInlineHook
   */
  public * findDelimiter(
    initialStartIndex: number,
    endIndex: number,
    nodePoints: ReadonlyArray<NodePoint>,
  ): ResultOfFindDelimiters<Delimiter> {
    const potentialDelimiters: YastTokenDelimiter[] = []
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

          const delimiter: YastTokenDelimiter = {
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
          if (thickness <= 1) {
            break
          }

          const delimiter: YastTokenDelimiter = {
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
      let closerDelimiter: YastTokenDelimiter | null = null

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

      const delimiter: Delimiter = {
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
   * @see TokenizerMatchInlineHook
   */

  /**
   * @override
   * @see TokenizerMatchInlineHook
   */
  public processFullDelimiter(
    fullDelimiter: Delimiter,
  ): Token | null {
    const token: Token = {
      type: InlineFormulaType,
      startIndex: fullDelimiter.startIndex,
      endIndex: fullDelimiter.endIndex,
      thickness: fullDelimiter.thickness,
    }
    return token
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
    let startIndex: number = token.startIndex + token.thickness
    let endIndex: number = token.endIndex - token.thickness

    let isAllSpace = true
    for (let i = startIndex; i < endIndex; ++i) {
      if (isSpaceLike(nodePoints[i].codePoint)) continue
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
      const firstCharacter = nodePoints[startIndex].codePoint
      const lastCharacter = nodePoints[endIndex - 1].codePoint
      if (isSpaceLike(firstCharacter) && isSpaceLike(lastCharacter)) {
        startIndex += 1
        endIndex -= 1
      }
    }

    const result: Node = {
      type: InlineFormulaType,
      value: calcStringFromNodePoints(nodePoints, startIndex, endIndex)
        .replace(/\n/, ' ')
    }
    return result
  }
}


/**
 * Line endings are treated like spaces
 * @see https://github.github.com/gfm/#example-345
 * @see https://github.github.com/gfm/#example-346
 */
function isSpaceLike(c: CodePoint): boolean {
  return isSpaceCharacter(c) || isLineEnding(c)
}
