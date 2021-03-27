import type { RootMeta as Meta, YastNode } from '@yozora/ast'
import { EmphasisType, StrongType } from '@yozora/ast'
import type { NodePoint } from '@yozora/character'
import {
  AsciiCodePoint,
  isPunctuationCharacter,
  isUnicodeWhitespaceCharacter,
} from '@yozora/character'
import type {
  ResultOfFindDelimiters,
  ResultOfIsDelimiterPair,
  ResultOfProcessDelimiterPair,
  Tokenizer,
  TokenizerMatchInlineHook,
  TokenizerParseInlineHook,
  YastInlineToken,
} from '@yozora/core-tokenizer'
import { BaseTokenizer } from '@yozora/core-tokenizer'
import type { Delimiter, Node, T, Token, TokenizerProps } from './types'
import { uniqueName } from './types'

/**
 * Lexical Analyzer for Emphasis and Strong Emphasis.
 *
 * @see https://github.com/syntax-tree/mdast#strong
 * @see https://github.github.com/gfm/#emphasis-and-strong-emphasis
 */
export class EmphasisTokenizer
  extends BaseTokenizer
  implements
    Tokenizer,
    TokenizerMatchInlineHook<T, Delimiter, Token, Meta>,
    TokenizerParseInlineHook<T, Token, Node, Meta> {
  public readonly delimiterGroup: string

  /* istanbul ignore next */
  constructor(props: TokenizerProps = {}) {
    super({
      name: uniqueName,
      priority: props.priority,
    })
    this.delimiterGroup = props.delimiterGroup ?? this.name
  }

  /**
   * @override
   * @see TokenizerMatchInlineHook
   */
  public findDelimiter(
    startIndex: number,
    endIndex: number,
    nodePoints: ReadonlyArray<NodePoint>,
  ): ResultOfFindDelimiters<Delimiter> {
    /**
     * Check if it is a opener delimiter.
     * @see https://github.github.com/gfm/#left-flanking-delimiter-run
     */
    const isOpenerDelimiter = (
      delimiterStartIndex: number,
      delimiterEndIndex: number,
    ): boolean => {
      // Left-flanking delimiter should not followed by Unicode whitespace
      const nextCodePosition =
        delimiterEndIndex >= endIndex ? null : nodePoints[delimiterEndIndex]
      if (
        nextCodePosition == null ||
        isUnicodeWhitespaceCharacter(nextCodePosition.codePoint)
      )
        return false

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
      if (delimiterStartIndex > startIndex) {
        // Right-flanking delimiter should not preceded by Unicode whitespace.
        const prevCodePosition = nodePoints[delimiterStartIndex - 1]
        if (isUnicodeWhitespaceCharacter(prevCodePosition.codePoint))
          return false

        // Right-flanking delimiter should not preceded by a punctuation character
        if (!isPunctuationCharacter(prevCodePosition.codePoint)) return true
      }

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
          const delimiter: Delimiter = {
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
   * @see TokenizerMatchInlineHook
   */
  public isDelimiterPair(
    openerDelimiter: Delimiter,
    closerDelimiter: Delimiter,
    higherPriorityInnerStates: ReadonlyArray<YastInlineToken>,
    nodePoints: ReadonlyArray<NodePoint>,
  ): ResultOfIsDelimiterPair {
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
    innerTokens: YastInlineToken[],
    nodePoints: ReadonlyArray<NodePoint>,
    meta: Readonly<Meta>,
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

    const context = this.getContext()
    if (context != null) {
      // eslint-disable-next-line no-param-reassign
      innerTokens = context.resolveFallbackTokens(
        innerTokens,
        openerDelimiter.endIndex,
        closerDelimiter.startIndex,
        nodePoints,
        meta,
      )
    }

    const token: Token = {
      _tokenizer: this.name,
      nodeType: thickness === 1 ? EmphasisType : StrongType,
      startIndex: openerDelimiter.endIndex - thickness,
      endIndex: closerDelimiter.startIndex + thickness,
      thickness,
      children: innerTokens,
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
      token,
      remainOpenerDelimiter,
      remainCloserDelimiter,
    }
  }

  /**
   * @override
   * @see TokenizerParseInlineHook
   */
  public processToken(token: Token, children?: YastNode[]): Node {
    const result: Node = {
      type: token.nodeType,
      children: children || [],
    }
    return result
  }
}
