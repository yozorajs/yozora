import type { IYastNode } from '@yozora/ast'
import { HeadingType } from '@yozora/ast'
import {
  AsciiCodePoint,
  calcTrimBoundaryOfCodePoints,
  isSpaceCharacter,
  isWhitespaceCharacter,
} from '@yozora/character'
import type {
  IMatchBlockHook,
  IParseBlockHook,
  IParseBlockPhaseApi,
  IPhrasingContentLine,
  IResultOfEatAndInterruptPreviousSibling,
  IResultOfEatOpener,
  IResultOfParse,
  ITokenizer,
  IYastBlockToken,
} from '@yozora/core-tokenizer'
import {
  BaseBlockTokenizer,
  TokenizerPriority,
  calcEndYastNodePoint,
  calcStartYastNodePoint,
  eatOptionalCharacters,
} from '@yozora/core-tokenizer'
import type { INode, IToken, ITokenizerProps, T } from './types'
import { uniqueName } from './types'

/**
 * Lexical Analyzer for Heading.
 *
 * An ATX heading consists of a string of characters, parsed as inline content,
 * between an opening sequence of 1–6 unescaped '#' characters and an optional
 * closing sequence of any number of unescaped '#' characters. The opening
 * sequence of '#' characters must be followed by a space or by the end of line.
 * The optional closing sequence of #s must be preceded by a space and may be
 * followed by spaces only. The opening # character may be indented 0-3 spaces.
 * The raw contents of the heading are stripped of leading and trailing spaces
 * before being parsed as inline content. The heading level is equal to the
 * number of '#' characters in the opening sequence.
 *
 * @see https://github.com/syntax-tree/mdast#heading
 * @see https://github.github.com/gfm/#atx-heading
 */
export class HeadingTokenizer
  extends BaseBlockTokenizer
  implements ITokenizer, IMatchBlockHook<T, IToken>, IParseBlockHook<T, IToken, INode>
{
  public readonly isContainingBlock = false

  /* istanbul ignore next */
  constructor(props: ITokenizerProps = {}) {
    super({
      name: props.name ?? uniqueName,
      priority: props.priority ?? TokenizerPriority.ATOMIC,
    })
  }

  /**
   * @override
   * @see IMatchBlockHook
   */
  public eatOpener(line: Readonly<IPhrasingContentLine>): IResultOfEatOpener<T, IToken> {
    /**
     * Four spaces are too much
     * @see https://github.github.com/gfm/#example-39
     * @see https://github.github.com/gfm/#example-40
     */
    if (line.countOfPrecedeSpaces >= 4) return null

    const { nodePoints, startIndex, endIndex, firstNonWhitespaceIndex } = line
    if (
      firstNonWhitespaceIndex >= endIndex ||
      nodePoints[firstNonWhitespaceIndex].codePoint !== AsciiCodePoint.NUMBER_SIGN
    ) {
      return null
    }

    const i = eatOptionalCharacters(
      nodePoints,
      firstNonWhitespaceIndex + 1,
      endIndex,
      AsciiCodePoint.NUMBER_SIGN,
    )
    const depth: number = i - firstNonWhitespaceIndex

    /**
     * More than six '#' characters is not a heading
     * @see https://github.github.com/gfm/#example-33
     */
    if (depth > 6) return null

    /**
     * At least one space is required between the '#' characters and the
     * heading’s contents, unless the heading is empty. Note that many
     * implementations currently do not require the space. However, the space
     * was required by the original ATX implementation, and it helps prevent
     * things like the following from being parsed as headings:
     *
     * ATX headings can be empty
     * @see https://github.github.com/gfm/#example-49
     */
    if (i + 1 < endIndex && !isSpaceCharacter(nodePoints[i].codePoint)) return null

    const nextIndex = endIndex
    const token: IToken = {
      nodeType: HeadingType,
      position: {
        start: calcStartYastNodePoint(nodePoints, startIndex),
        end: calcEndYastNodePoint(nodePoints, nextIndex - 1),
      },
      depth: depth as IToken['depth'],
      line,
    }
    return { token, nextIndex, saturated: true }
  }

  /**
   * @override
   * @see IMatchBlockHook
   */
  public eatAndInterruptPreviousSibling(
    line: Readonly<IPhrasingContentLine>,
    prevSiblingToken: Readonly<IYastBlockToken>,
  ): IResultOfEatAndInterruptPreviousSibling<T, IToken> {
    const result = this.eatOpener(line)
    if (result == null) return null
    return {
      token: result.token,
      nextIndex: result.nextIndex,
      remainingSibling: prevSiblingToken,
    }
  }

  /**
   * @override
   * @see IParseBlockHook
   */
  public parseBlock(
    token: Readonly<IToken>,
    children: IYastNode[],
    api: Readonly<IParseBlockPhaseApi>,
  ): IResultOfParse<T, INode> {
    const { nodePoints, firstNonWhitespaceIndex, endIndex } = token.line

    /**
     * Leading and trailing whitespace is ignored in parsing inline content
     * Spaces are allowed after the closing sequence
     * @see https://github.github.com/gfm/#example-37
     * @see https://github.github.com/gfm/#example-43
     */
    // eslint-disable-next-line prefer-const
    let [leftIndex, rightIndex] = calcTrimBoundaryOfCodePoints(
      nodePoints,
      firstNonWhitespaceIndex + token.depth,
      endIndex,
    )

    /**
     * A closing sequence of '#' characters is optional
     * It need not be the same length as the opening sequence
     * @see https://github.github.com/gfm/#example-41
     * @see https://github.github.com/gfm/#example-42
     * @see https://github.github.com/gfm/#example-44
     */
    let closeCharCount = 0
    for (let j = rightIndex - 1; j >= leftIndex; --j) {
      const c = nodePoints[j].codePoint
      if (c !== AsciiCodePoint.NUMBER_SIGN) break
      closeCharCount += 1
    }
    if (closeCharCount > 0) {
      let spaceCount = 0,
        j = rightIndex - 1 - closeCharCount
      for (; j >= leftIndex; --j) {
        const c = nodePoints[j].codePoint
        if (!isWhitespaceCharacter(c)) break
        spaceCount += 1
      }
      if (spaceCount > 0 || j < leftIndex) {
        rightIndex -= closeCharCount + spaceCount
      }
    }

    // Resolve phrasing content.
    const lines: IPhrasingContentLine[] = [
      {
        nodePoints,
        startIndex: leftIndex,
        endIndex: rightIndex,
        firstNonWhitespaceIndex: leftIndex,
        countOfPrecedeSpaces: 0,
      },
    ]
    const phrasingContent = api.buildPhrasingContent(lines)

    const node: INode = {
      type: HeadingType,
      depth: token.depth,
      children: phrasingContent == null ? [] : [phrasingContent],
    }
    return node
  }
}
