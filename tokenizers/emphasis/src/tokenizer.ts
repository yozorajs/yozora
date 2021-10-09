import type { YastNode } from '@yozora/ast'
import { EmphasisType, StrongType } from '@yozora/ast'
import type { NodePoint } from '@yozora/character'
import {
  AsciiCodePoint,
  isPunctuationCharacter,
  isUnicodeWhitespaceCharacter,
} from '@yozora/character'
import type {
  MatchInlinePhaseApi,
  ResultOfIsDelimiterPair,
  ResultOfProcessDelimiterPair,
  Tokenizer,
  TokenizerMatchInlineHook,
  TokenizerParseInlineHook,
  YastInlineToken,
} from '@yozora/core-tokenizer'
import {
  BaseInlineTokenizer,
  TokenizerPriority,
  eatOptionalCharacters,
} from '@yozora/core-tokenizer'
import type { Delimiter, Node, T, Token, TokenizerProps } from './types'
import { uniqueName } from './types'

/**
 * Lexical Analyzer for Emphasis and Strong Emphasis.
 *
 * @see https://github.com/syntax-tree/mdast#strong
 * @see https://github.github.com/gfm/#emphasis-and-strong-emphasis
 */
export class EmphasisTokenizer
  extends BaseInlineTokenizer<Delimiter>
  implements
    Tokenizer,
    TokenizerMatchInlineHook<T, Delimiter, Token>,
    TokenizerParseInlineHook<T, Token, Node>
{
  /* istanbul ignore next */
  constructor(props: TokenizerProps = {}) {
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
    api: Readonly<MatchInlinePhaseApi>,
  ): Delimiter | null {
    const nodePoints: ReadonlyArray<NodePoint> = api.getNodePoints()
    const blockStartIndex: number = api.getBlockStartIndex()
    const blockEndIndex: number = api.getBlockEndIndex()

    /**
     * Check if it is a opener delimiter.
     * @see https://github.github.com/gfm/#left-flanking-delimiter-run
     */
    const isOpenerDelimiter = (
      delimiterStartIndex: number,
      delimiterEndIndex: number,
    ): boolean => {
      if (delimiterEndIndex === blockEndIndex) return false
      if (delimiterEndIndex === endIndex) return true

      // Left-flanking delimiter should not followed by Unicode whitespace
      const nextCodePosition = nodePoints[delimiterEndIndex]
      if (isUnicodeWhitespaceCharacter(nextCodePosition.codePoint)) return false

      // Left-flanking delimiter should not followed by a punctuation character
      if (!isPunctuationCharacter(nextCodePosition.codePoint)) return true

      // Or followed by a punctuation character and preceded
      // by Unicode whitespace or a punctuation character
      if (delimiterStartIndex <= startIndex) return true
      const prevCodePosition = nodePoints[delimiterStartIndex - 1]
      return (
        isUnicodeWhitespaceCharacter(prevCodePosition.codePoint) ||
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
      if (delimiterStartIndex === blockStartIndex) return false
      if (delimiterStartIndex === startIndex) return true

      // Right-flanking delimiter should not preceded by Unicode whitespace.
      const prevCodePosition = nodePoints[delimiterStartIndex - 1]
      if (isUnicodeWhitespaceCharacter(prevCodePosition.codePoint)) return false

      // Right-flanking delimiter should not preceded by a punctuation character
      if (!isPunctuationCharacter(prevCodePosition.codePoint)) return true

      // Or preceded by a punctuation character and followed
      // by Unicode whitespace or a punctuation character
      if (delimiterEndIndex >= endIndex) return true
      const nextCodePosition = nodePoints[delimiterEndIndex]
      return (
        isUnicodeWhitespaceCharacter(nextCodePosition.codePoint) ||
        isPunctuationCharacter(nextCodePosition.codePoint)
      )
    }

    for (let i = startIndex; i < endIndex; ++i) {
      const c = nodePoints[i].codePoint
      switch (c) {
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
          i = eatOptionalCharacters(nodePoints, i + 1, endIndex, c) - 1

          const _endIndex = i + 1
          const isLeftFlankingDelimiterRun = isOpenerDelimiter(
            _startIndex,
            _endIndex,
          )
          const isRightFlankingDelimiterRun = isCloserDelimiter(
            _startIndex,
            _endIndex,
          )

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
          if (c === AsciiCodePoint.UNDERSCORE) {
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
          return {
            type: isOpener ? (isCloser ? 'both' : 'opener') : 'closer',
            startIndex: _startIndex,
            endIndex: _endIndex,
            thickness,
            originalThickness: thickness,
          }
        }
      }
    }
    return null
  }

  /**
   * @override
   * @see TokenizerMatchInlineHook
   */
  public isDelimiterPair(
    openerDelimiter: Delimiter,
    closerDelimiter: Delimiter,
    internalTokens: ReadonlyArray<YastInlineToken>,
    api: Readonly<MatchInlinePhaseApi>,
  ): ResultOfIsDelimiterPair {
    const nodePoints: ReadonlyArray<NodePoint> = api.getNodePoints()

    /**
     * Rule #9: Node begins with a delimiter that can open emphasis
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
      nodePoints[openerDelimiter.startIndex].codePoint !==
        nodePoints[closerDelimiter.startIndex].codePoint ||
      ((openerDelimiter.type === 'both' || closerDelimiter.type === 'both') &&
        (openerDelimiter.originalThickness +
          closerDelimiter.originalThickness) %
          3 ===
          0 &&
        openerDelimiter.originalThickness % 3 !== 0)
    ) {
      return { paired: false, opener: true, closer: true }
    }
    return { paired: true }
  }

  /**
   * @override
   * @see TokenizerMatchInlineHook
   */
  public processDelimiterPair(
    openerDelimiter: Delimiter,
    closerDelimiter: Delimiter,
    internalTokens: ReadonlyArray<YastInlineToken>,
    api: Readonly<MatchInlinePhaseApi>,
  ): ResultOfProcessDelimiterPair<T, Token, Delimiter> {
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

    // eslint-disable-next-line no-param-reassign
    internalTokens = api.resolveInternalTokens(
      internalTokens,
      openerDelimiter.endIndex,
      closerDelimiter.startIndex,
    )

    const token: Token = {
      nodeType: thickness === 1 ? EmphasisType : StrongType,
      startIndex: openerDelimiter.endIndex - thickness,
      endIndex: closerDelimiter.startIndex + thickness,
      thickness,
      children: internalTokens,
    }
    const remainOpenerDelimiter: Delimiter | undefined =
      openerDelimiter.thickness > thickness
        ? {
            type: openerDelimiter.type,
            startIndex: openerDelimiter.startIndex,
            endIndex: openerDelimiter.endIndex - thickness,
            thickness: openerDelimiter.thickness - thickness,
            originalThickness: openerDelimiter.originalThickness,
          }
        : undefined
    const remainCloserDelimiter: Delimiter | undefined =
      closerDelimiter.thickness > thickness
        ? {
            type: closerDelimiter.type,
            startIndex: closerDelimiter.startIndex + thickness,
            endIndex: closerDelimiter.endIndex,
            thickness: closerDelimiter.thickness - thickness,
            originalThickness: closerDelimiter.originalThickness,
          }
        : undefined
    return {
      tokens: [token],
      remainOpenerDelimiter,
      remainCloserDelimiter,
    }
  }

  /**
   * @override
   * @see TokenizerParseInlineHook
   */
  public processToken(token: Token, children: YastNode[]): Node {
    const result: Node = {
      type: token.nodeType,
      children,
    }
    return result
  }
}
