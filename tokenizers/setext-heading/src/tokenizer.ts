import type { Heading } from '@yozora/ast'
import { HeadingType } from '@yozora/ast'
import {
  AsciiCodePoint,
  VirtualCodePoint,
  isUnicodeWhitespaceCharacter,
} from '@yozora/character'
import type {
  PhrasingContentLine,
  ResultOfEatAndInterruptPreviousSibling,
  ResultOfEatOpener,
  ResultOfParse,
  Tokenizer,
  TokenizerMatchBlockHook,
  TokenizerParseBlockHook,
  YastBlockToken,
} from '@yozora/core-tokenizer'
import {
  BaseTokenizer,
  calcEndYastNodePoint,
  calcStartYastNodePoint,
} from '@yozora/core-tokenizer'
import type { Node, T, Token, TokenizerProps } from './types'
import { uniqueName } from './types'

/**
 * Lexical Analyzer for SetextHeading.
 *
 * A setext heading consists of one or more lines of text, each containing
 * at least one non-whitespace character, with no more than 3 spaces
 * indentation, followed by a setext heading underline. The lines of text must
 * be such that, were they not followed by the setext heading underline, they
 * would be interpreted as a paragraph.
 *
 * @see https://github.github.com/gfm/#setext-heading
 */
export class SetextHeadingTokenizer
  extends BaseTokenizer
  implements
    Tokenizer,
    TokenizerMatchBlockHook<T, Token>,
    TokenizerParseBlockHook<T, Token, Node> {
  public readonly isContainerBlock = false

  /* istanbul ignore next */
  constructor(props: TokenizerProps = {}) {
    super({
      name: uniqueName,
      priority: props.priority,
    })
  }

  /**
   * @override
   * @see TokenizerMatchBlockHook
   */
  public eatOpener(): ResultOfEatOpener<T, Token> {
    return null
  }

  /**
   * @override
   * @see TokenizerMatchBlockHook
   */
  public eatAndInterruptPreviousSibling(
    line: Readonly<PhrasingContentLine>,
    prevSiblingToken: Readonly<YastBlockToken>,
  ): ResultOfEatAndInterruptPreviousSibling<T, Token> {
    const {
      nodePoints,
      endIndex,
      firstNonWhitespaceIndex,
      countOfPrecedeSpaces,
    } = line

    /**
     * Four spaces is too much
     * @see https://github.github.com/gfm/#example-55
     * @see https://github.github.com/gfm/#example-57
     */
    if (countOfPrecedeSpaces >= 4 || firstNonWhitespaceIndex >= endIndex)
      return null

    let marker: number | null = null,
      hasPotentialInternalSpace = false
    for (let i = firstNonWhitespaceIndex; i < endIndex; ++i) {
      const c = nodePoints[i]
      if (c.codePoint == VirtualCodePoint.LINE_END) break

      /**
       * The setext heading underline can be indented up to three spaces,
       * and may have trailing spaces
       * @see https://github.github.com/gfm/#example-56
       */
      if (isUnicodeWhitespaceCharacter(c.codePoint)) {
        hasPotentialInternalSpace = true
        continue
      }

      /**
       * The setext heading underline cannot contain internal spaces
       * @see https://github.github.com/gfm/#example-58
       *
       * A setext heading underline is a sequence of '=' characters or
       * a sequence of '-' characters
       * @see https://github.github.com/gfm/#setext-heading-underline
       */
      if (
        hasPotentialInternalSpace ||
        (c.codePoint !== AsciiCodePoint.EQUALS_SIGN &&
          c.codePoint !== AsciiCodePoint.MINUS_SIGN) ||
        (marker != null && marker !== c.codePoint)
      ) {
        marker = null
        break
      }

      marker = c.codePoint
    }

    // Not a valid setext heading underline
    if (marker == null) return null

    const context = this.getContext()!
    const lines = context.extractPhrasingContentLines(prevSiblingToken)
    if (lines == null) return null

    const nextIndex = endIndex
    const token: Token = {
      nodeType: HeadingType,
      position: {
        start: calcStartYastNodePoint(lines[0].nodePoints, lines[0].startIndex),
        end: calcEndYastNodePoint(nodePoints, nextIndex - 1),
      },
      marker,
      lines: [...lines],
    }
    return {
      token,
      nextIndex,
      saturated: true,
      remainingSibling: null,
    }
  }

  /**
   * @override
   * @see TokenizerParseBlockHook
   */
  public parseBlock(token: Readonly<Token>): ResultOfParse<T, Node> {
    let depth: Heading['depth'] = 1
    switch (token.marker) {
      /**
       * The heading is a level 1 heading if '=' characters are used
       */
      case AsciiCodePoint.EQUALS_SIGN:
        depth = 1
        break
      /**
       * The heading is a level 2 heading if '-' characters are used
       */
      case AsciiCodePoint.MINUS_SIGN:
        depth = 2
        break
    }

    const node: Node = {
      type: HeadingType,
      depth,
      children: [],
    }

    const context = this.getContext()!
    const phrasingContentState = context.buildPhrasingContentToken(token.lines)
    if (phrasingContentState != null) {
      const phrasingContent = context.buildPhrasingContent(phrasingContentState)
      if (phrasingContent != null) {
        node.children.push(phrasingContent)
      }
    }

    return { classification: 'flow', node }
  }
}
