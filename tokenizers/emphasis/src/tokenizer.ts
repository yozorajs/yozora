import type {
  EnhancedYastNodePoint,
  YastMeta as M,
} from '@yozora/tokenizercore'
import type {
  InlinePotentialToken,
  InlineTokenDelimiter,
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerParsePhaseHook,
  InlineTokenizerParsePhaseState,
  InlineTokenizerProps,
  ResultOfEatDelimiters,
  ResultOfEatPotentialTokens,
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


type PT = InlinePotentialToken<T>


/**
 * Lexical Analyzer for PS
 */
export class EmphasisTokenizer extends BaseInlineTokenizer<T> implements
  InlineTokenizer<T>,
  InlineTokenizerMatchPhaseHook<T, M, MS, TD>,
  InlineTokenizerParsePhaseHook<T, M, MS, PS>
{
  public readonly name = 'EmphasisTokenizer'
  public readonly uniqueTypes: T[] = [EmphasisItalicType, EmphasisStrongType]

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

      const { startIndex, endIndex, precedingCodePosition, followingCodePosition } = nextParams

      /**
       * Check if it is a left delimiter
       * @see https://github.github.com/gfm/#left-flanking-delimiter-run
       */
      const checkIfLeftFlankingDelimiterRun = (
        delimiterStartIndex: number,
        delimiterEndIndex: number,
      ): boolean => {
        // Left-flanking delimiter should not followed by Unicode whitespace
        const nextCodePosition = delimiterEndIndex >= endIndex
          ? followingCodePosition
          : nodePoints[delimiterEndIndex]
        if (
          nextCodePosition == null ||
          isUnicodeWhiteSpaceCharacter(nextCodePosition.codePoint)
        ) return false

        // Left-flanking delimiter should not followed by a punctuation character
        if (!isPunctuationCharacter(nextCodePosition.codePoint)) return true

        // Or followed by a punctuation character and preceded
        // by Unicode whitespace or a punctuation character
        const prevCodePosition = delimiterStartIndex <= startIndex
          ? precedingCodePosition
          : nodePoints[delimiterStartIndex - 1]
        return (
          prevCodePosition == null ||
          isUnicodeWhiteSpaceCharacter(prevCodePosition.codePoint) ||
          isPunctuationCharacter(prevCodePosition.codePoint)
        )
      }

      /**
       * Check if it is a right delimiter
       * @see https://github.github.com/gfm/#right-flanking-delimiter-run
       */
      const checkIfRightFlankingDelimiterRun = (
        delimiterStartIndex: number,
        delimiterEndIndex: number,
      ): boolean => {
        // Right-flanking delimiter should not preceded by Unicode whitespace
        const prevCodePosition = delimiterStartIndex <= startIndex
          ? precedingCodePosition
          : nodePoints[delimiterStartIndex - 1]
        if (
          prevCodePosition == null ||
          isUnicodeWhiteSpaceCharacter(prevCodePosition.codePoint)
        ) return false

        // Right-flanking delimiter should not preceded by a punctuation character
        if (!isPunctuationCharacter(prevCodePosition.codePoint)) return true

        // Or preceded by a punctuation character and followed
        // by Unicode whitespace or a punctuation character
        const nextCodePosition = delimiterEndIndex >= endIndex
          ? followingCodePosition
          : nodePoints[delimiterEndIndex]
        return (
          nextCodePosition == null ||
          isUnicodeWhiteSpaceCharacter(nextCodePosition.codePoint) ||
          isPunctuationCharacter(nextCodePosition.codePoint)
        )
      }

      for (let i = startIndex; i < endIndex; ++i) {
        const p = nodePoints[i]
        switch (p.codePoint) {
          case AsciiCodePoint.BACK_SLASH:
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
            while (i + 1 < endIndex && nodePoints[i + 1].codePoint === p.codePoint) {
              i += 1
            }

            const _endIndex = i + 1
            const isLeftFlankingDelimiterRun =
              checkIfLeftFlankingDelimiterRun(_startIndex, _endIndex)
            const isRightFlankingDelimiterRun =
              checkIfRightFlankingDelimiterRun(_startIndex, _endIndex)

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
                const prevCodePosition = nodePoints[_startIndex - 1]
                if (!isPunctuationCharacter(prevCodePosition.codePoint)) {
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
            const delimiter: TD = {
              type: isOpener ? (isCloser ? 'both' : 'opener') : 'closer',
              startIndex: _startIndex,
              endIndex: _endIndex,
              thickness: _endIndex - _startIndex,
              originalThickness: _endIndex - _startIndex,
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
    const isMatched = (
      openerDelimiter: TD,
      closerDelimiter: TD,
    ): boolean => {
      if (
        nodePoints[openerDelimiter.startIndex].codePoint
        !== nodePoints[closerDelimiter.startIndex].codePoint
      ) return false
      if (
        openerDelimiter.type !== 'both' &&
        closerDelimiter.type !== 'both'
      ) return true
      return (
        (openerDelimiter.originalThickness + closerDelimiter.originalThickness) % 3 !== 0 ||
        openerDelimiter.originalThickness % 3 === 0
      )
    }

    const results: PT[] = []

    /**
     * Implement an algorithm similar to bracket matching, pushing all
     * opener delimiters onto the stack
     *
     * Rule #16: When there are two potential emphasis or strong emphasis
     *           spans with the same closing delimiter, the shorter one (the
     *           one that opens later) takes precedence. Thus, for example,
     *           **foo **bar baz** is parsed as **foo <strong>bar baz</strong>
     *           rather than <strong>foo **bar baz</strong>.
     * @see https://github.github.com/gfm/#example-480
     * @see https://github.github.com/gfm/#example-481
     */
    const openerDelimiterStack: TD[] = []
    for (let i = 0; i < delimiters.length; ++i) {
      const currentDelimiter = delimiters[i]
      if (currentDelimiter.type === 'opener') {
        openerDelimiterStack.push(currentDelimiter)
        continue
      }

      /**
       * If the opener delimiter stack is empty, consider the type of
       *  current delimiter:
       *  - `closer`: it is not a valid delimiter;
       *  - `both`: it may be used as the opener delimiter
       */
      if (openerDelimiterStack.length <= 0) {
        if (currentDelimiter.type === 'both') {
          openerDelimiterStack.push(currentDelimiter)
        }
        continue
      }

      const rightDelimiter = currentDelimiter
      while (openerDelimiterStack.length > 0 && rightDelimiter.thickness > 0) {
        let x = openerDelimiterStack.length - 1
        /**
         * Rule #15: When two potential emphasis or strong emphasis spans
         *           overlap, so that the second begins before the first ends
         *           and ends after the first ends, the first takes precedence.
         *           Thus, for example, *foo _bar* baz_ is parsed as
         *            <em>foo _bar</em> baz_ rather than *foo <em>bar* baz</em>.
         */
        for (; x >= 0; --x) {
          const leftDelimiter = openerDelimiterStack[x]
          if (isMatched(leftDelimiter, rightDelimiter)) break
        }
        if (x < 0) break
        if (x + 1 < openerDelimiterStack.length) {
          openerDelimiterStack.splice(x + 1, openerDelimiterStack.length - x - 1)
        }

        const leftDelimiter = openerDelimiterStack.pop()!

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
         */
        let thickness = 1
        if (leftDelimiter.thickness > 1 && rightDelimiter.thickness > 1) {
          thickness = 2
        }

        const opener: InlineTokenDelimiter = {
          type: leftDelimiter.type,
          startIndex: leftDelimiter.endIndex - thickness,
          endIndex: leftDelimiter.endIndex,
        }
        leftDelimiter.endIndex -= thickness
        leftDelimiter.thickness -= thickness

        const closer: InlineTokenDelimiter = {
          type: rightDelimiter.type,
          startIndex: rightDelimiter.startIndex,
          endIndex: rightDelimiter.startIndex + thickness,
        }
        rightDelimiter.startIndex += thickness
        rightDelimiter.thickness -= thickness

        const state: MS = {
          type: thickness === 1
            ? EmphasisItalicType
            : EmphasisStrongType,
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

        /**
         * If the opener delimiter has residual content, push it to the stack
         * and continue to use it in the next iteration
         */
        if (leftDelimiter.thickness > 0) {
          openerDelimiterStack.push(leftDelimiter)
        }
      }

      /**
       * If the delimiter type is `both`, and it has unmatched content,
       * it may be used as the opener delimiter in the next match processing
       */
      if (currentDelimiter.type === 'both' && currentDelimiter.thickness > 0) {
        openerDelimiterStack.push(currentDelimiter)
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
    parsedChildren?: InlineTokenizerParsePhaseState[],
  ): PS {
    const result: PS = {
      type: matchPhaseState.type,
      children: parsedChildren || [],
    }
    return result
  }
}
