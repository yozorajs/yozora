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
  Emphasis as PS,
  EmphasisMatchPhaseState as MS,
  EmphasisTokenDelimiter as TD,
  EmphasisType as T,
} from './types'
import {
  AsciiCodePoint,
  isPunctuationCharacter,
  isUnicodeWhiteSpaceCharacter,
} from '@yozora/character'
import { BaseInlineTokenizer } from '@yozora/tokenizercore-inline'
import { EmphasisItalicType, EmphasisStrongType } from './types'


/**
 * Params for constructing EmphasisTokenizer
 */
export interface EmphasisTokenizerProps {
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
export class EmphasisTokenizer extends BaseInlineTokenizer implements
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook<T, M, MS, TD>,
  InlineTokenizerParsePhaseHook<T, M, MS, PS>
{
  public readonly name = 'EmphasisTokenizer'
  public readonly delimiterGroup: string = 'EmphasisTokenizer'
  public readonly recognizedTypes: T[] = [EmphasisItalicType, EmphasisStrongType]
  public readonly delimiterPriority: number = -1

  public constructor(props: EmphasisTokenizerProps = {}) {
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
    /**
     * Check if it is a opener delimiter.
     * @see https://github.github.com/gfm/#left-flanking-delimiter-run
     */
    const isOpenerDelimiter = (
      delimiterStartIndex: number,
      delimiterEndIndex: number,
    ): boolean => {
      // Left-flanking delimiter should not followed by Unicode whitespace
      const nextCodePosition = delimiterEndIndex >= endIndex
        ? null
        : nodePoints[delimiterEndIndex]
      if (
        nextCodePosition == null ||
        isUnicodeWhiteSpaceCharacter(nextCodePosition.codePoint)
      ) return false

      // Left-flanking delimiter should not followed by a punctuation character
      if (!isPunctuationCharacter(nextCodePosition.codePoint)) return true

      // Or followed by a punctuation character and preceded
      // by Unicode whitespace or a punctuation character
      if (delimiterStartIndex <= startIndex) return true
      const prevCodePosition = nodePoints[delimiterStartIndex - 1]
      return (
        isUnicodeWhiteSpaceCharacter(prevCodePosition.codePoint) ||
        isPunctuationCharacter(prevCodePosition.codePoint)
      )
    }

    /**
     * Check if it is a closer delimiter.
     * @see https://github.github.com/gfm/#right-flanking-delimiter-run
     */
    const isCloserDelimiter = (
      delimiterStartIndex: number,
      delimiterEndIndex: number,
    ): boolean => {
      if (delimiterStartIndex > startIndex) {
        // Right-flanking delimiter should not preceded by Unicode whitespace.
        const prevCodePosition = nodePoints[delimiterStartIndex - 1]
        if (isUnicodeWhiteSpaceCharacter(prevCodePosition.codePoint)) return false

        // Right-flanking delimiter should not preceded by a punctuation character
        if (!isPunctuationCharacter(prevCodePosition.codePoint)) return true
      }

      // Or preceded by a punctuation character and followed
      // by Unicode whitespace or a punctuation character
      if (delimiterEndIndex >= endIndex) return true
      const nextCodePosition = nodePoints[delimiterEndIndex]
      return (
        isUnicodeWhiteSpaceCharacter(nextCodePosition.codePoint) ||
        isPunctuationCharacter(nextCodePosition.codePoint)
      )
    }

    for (let i = startIndex; i < endIndex; ++i) {
      const p = nodePoints[i]
      switch (p.codePoint) {
        case AsciiCodePoint.BACKSLASH:
          i += 1
          break
        /**
         * Rule #1: A single <i>*</i> character can open emphasis iff (if and
         *          only if) it is part of a left-flanking delimiter run.
         * Rule #5: (..omit..)
         * @see https://github.github.com/gfm/#example-360
         *
         * Rule #3: A single <i>*</i> character can close emphasis iff it is
         *          part of a right-flanking delimiter run.
         * Rule #7: (..omit..)
         * @see https://github.github.com/gfm/#example-366
         *
         * @see https://github.github.com/gfm/#can-open-emphasis
         */
        case AsciiCodePoint.ASTERISK:
        case AsciiCodePoint.UNDERSCORE: {
          const _startIndex = i

          // matched as many asterisk/underscore as possible
          for (; i + 1 < endIndex; ++i) {
            if (nodePoints[i + 1].codePoint !== p.codePoint) break
          }

          const _endIndex = i + 1
          const isLeftFlankingDelimiterRun =
            isOpenerDelimiter(_startIndex, _endIndex)
          const isRightFlankingDelimiterRun =
            isCloserDelimiter(_startIndex, _endIndex)

          let isOpener = isLeftFlankingDelimiterRun
          let isCloser = isRightFlankingDelimiterRun

          /**
           * Rule #2: A single <i>_</i> character can open emphasis iff it is
           *          part of a left-flanking delimiter run and either:
           *            (a) not part of a right-flanking delimiter run, or
           *            (b) part of a right-flanking delimiter run preceded
           *                by punctuation.
           * Rule #6: (..omit..)
           * @see https://github.github.com/gfm/#example-367
           * @see https://github.github.com/gfm/#example-368
           * @see https://github.github.com/gfm/#example-369
           * @see https://github.github.com/gfm/#example-370
           * @see https://github.github.com/gfm/#example-373
           *
           * Rule #4: A single <i>_</i> character can open emphasis iff it is
           *          part of a right-flanking delimiter run and either:
           *            (a) not part of a left-flanking delimiter run, or
           *            (b) part of a left-flanking delimiter run followed
           *                by punctuation.
           * Rule #8: (..omit..)
           * @see https://github.github.com/gfm/#example-380
           * @see https://github.github.com/gfm/#example-381
           * @see https://github.github.com/gfm/#example-382
           * @see https://github.github.com/gfm/#example-383
           * @see https://github.github.com/gfm/#example-385
           */
          if (p.codePoint === AsciiCodePoint.UNDERSCORE) {
            if (isLeftFlankingDelimiterRun && isRightFlankingDelimiterRun) {
              // Rule #2
              if (
                _startIndex > startIndex &&
                !isPunctuationCharacter(nodePoints[_startIndex - 1].codePoint)
              ) {
                isOpener = false
              }

              // Rule #4
              const nextCodePosition = nodePoints[_endIndex]
              if (!isPunctuationCharacter(nextCodePosition.codePoint)) {
                isCloser = false
              }
            }
          }

          if (!isOpener && !isCloser) break
          const thickness = _endIndex - _startIndex
          const delimiter: TD = {
            type: isOpener ? (isCloser ? 'both' : 'opener') : 'closer',
            startIndex: _startIndex,
            endIndex: _endIndex,
            thickness,
            originalThickness: thickness,
          }
          return delimiter
        }
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
    /**
     * Rule #9: PS begins with a delimiter that can open emphasis
     *          and ends with a delimiter that can close emphasis, and that
     *          uses the same character (_ or *) as the opening delimiter.
     *          The opening and closing delimiters must belong to separate
     *          delimiter runs.
     *          If one of the delimiters can both open and close emphasis,
     *          then the sum of the lengths of the delimiter runs containing
     *          the opening and closing delimiters must not be a multiple
     *          of 3 unless both lengths are multiples of 3.
      * Rule #10: (..omit..)
      * @see https://github.github.com/gfm/#example-413
      * @see https://github.github.com/gfm/#example-42
      */
    if (
      (
        nodePoints[openerDelimiter.startIndex].codePoint !==
        nodePoints[closerDelimiter.startIndex].codePoint
      ) || (
        (openerDelimiter.type === 'both' || closerDelimiter.type === 'both') &&
        (openerDelimiter.originalThickness + closerDelimiter.originalThickness) % 3 === 0 &&
        openerDelimiter.originalThickness % 3 !== 0
      )
    ) {
      return {
        status: 'unpaired',
        remainOpenerDelimiter: openerDelimiter,
        remainCloserDelimiter: closerDelimiter,
      }
    }

    /**
     * Rule #13: The number of nestings should be minimized. Thus, for example,
     *           an interpretation '<strong>...</strong>' is always preferred
     *           to '<em><em>...</em></em>'.
     * @see https://github.github.com/gfm/#example-469
     * @see https://github.github.com/gfm/#example-470
     * @see https://github.github.com/gfm/#example-473
     * @see https://github.github.com/gfm/#example-475
     *
     * Rule #14: An interpretation '<em><strong>...</strong></em>' is always
     *           preferred to '<strong><em>...</em></strong>'
     * @see https://github.github.com/gfm/#example-476
     * @see https://github.github.com/gfm/#example-477
     *
     * Rule #16: When there are two potential emphasis or strong emphasis
     *           spans with the same closing delimiter, the shorter one (the
     *           one that opens later) takes precedence. Thus, for example,
     *           **foo **bar baz** is parsed as **foo <strong>bar baz</strong>
     *           rather than <strong>foo **bar baz</strong>.
     * @see https://github.github.com/gfm/#example-480
     * @see https://github.github.com/gfm/#example-481
     */
    let thickness = 1
    if (openerDelimiter.thickness > 1 && closerDelimiter.thickness > 1) {
      thickness = 2
    }

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
      type: thickness === 1 ? EmphasisItalicType : EmphasisStrongType,
      startIndex: openerDelimiter.endIndex - thickness,
      endIndex: closerDelimiter.startIndex + thickness,
      thickness,
      children: innerStates,
    }
    const remainOpenerDelimiter: TD | undefined = openerDelimiter.thickness > thickness
      ? {
        type: openerDelimiter.type,
        startIndex: openerDelimiter.startIndex,
        endIndex: openerDelimiter.endIndex - thickness,
        thickness: openerDelimiter.thickness - thickness,
        originalThickness: openerDelimiter.originalThickness,
      }
      : undefined
    const remainCloserDelimiter: TD | undefined = closerDelimiter.thickness > thickness
      ? {
        type: closerDelimiter.type,
        startIndex: closerDelimiter.startIndex + thickness,
        endIndex: closerDelimiter.endIndex,
        thickness: closerDelimiter.thickness - thickness,
        originalThickness: closerDelimiter.originalThickness,
      }
      : undefined
    return {
      status: 'paired',
      state,
      remainOpenerDelimiter,
      remainCloserDelimiter,
    }
  }

  /**
   * @override
   * @see InlineTokenizerParsePhaseHook
   */
  public parse(matchPhaseState: MS, parsedChildren?: YastInlineNode[]): PS {
    const result: PS = {
      type: matchPhaseState.type,
      children: parsedChildren || [],
    }
    return result
  }
}
