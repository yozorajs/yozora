import { CodeType } from '@yozora/ast'
import type { NodePoint } from '@yozora/character'
import {
  AsciiCodePoint,
  VirtualCodePoint,
  calcStringFromNodePoints,
} from '@yozora/character'
import type {
  PhrasingContentLine,
  ResultOfEatContinuationText,
  ResultOfEatOpener,
  ResultOfParse,
  Tokenizer,
  TokenizerMatchBlockHook,
  TokenizerParseBlockHook,
} from '@yozora/core-tokenizer'
import {
  BaseBlockTokenizer,
  TokenizerPriority,
  calcEndYastNodePoint,
  calcStartYastNodePoint,
  mergeContentLinesFaithfully,
} from '@yozora/core-tokenizer'
import type { Node, T, Token, TokenizerProps } from './types'
import { uniqueName } from './types'

/**
 * Lexical Analyzer for IndentedCode.
 *
 * An indented code block is composed of one or more indented chunks
 * separated by blank lines. An indented chunk is a sequence of non-blank
 * lines, each indented four or more spaces. The contents of the code block
 * are the literal contents of the lines, including trailing line endings,
 * minus four spaces of indentation.
 *
 * @see https://github.github.com/gfm/#indented-code-block
 */
export class IndentedCodeTokenizer
  extends BaseBlockTokenizer
  implements
    Tokenizer,
    TokenizerMatchBlockHook<T, Token>,
    TokenizerParseBlockHook<T, Token, Node>
{
  public readonly isContainingBlock = false

  /* istanbul ignore next */
  constructor(props: TokenizerProps = {}) {
    super({
      name: props.name ?? uniqueName,
      priority: props.priority ?? TokenizerPriority.ATOMIC,
    })
  }

  /**
   * @override
   * @see TokenizerMatchBlockHook
   */
  public eatOpener(
    line: Readonly<PhrasingContentLine>,
  ): ResultOfEatOpener<T, Token> {
    if (line.countOfPrecedeSpaces < 4) return null
    const { nodePoints, startIndex, firstNonWhitespaceIndex, endIndex } = line

    let firstIndex = startIndex + 4

    /**
     * If there exists 1-3 spaces before a tab forms the indent, the remain
     * virtual spaces of the tab should not be a part of the contents.
     * @see https://github.github.com/gfm/#example-2
     */
    if (
      nodePoints[startIndex].codePoint === AsciiCodePoint.SPACE &&
      nodePoints[startIndex + 3].codePoint === VirtualCodePoint.SPACE
    ) {
      let i = startIndex + 1
      for (; i < firstNonWhitespaceIndex; ++i) {
        if (nodePoints[i].codePoint === VirtualCodePoint.SPACE) break
      }
      firstIndex = i + 4
    }

    const nextIndex = endIndex
    const token: Token = {
      nodeType: CodeType,
      position: {
        start: calcStartYastNodePoint(nodePoints, startIndex),
        end: calcEndYastNodePoint(nodePoints, nextIndex - 1),
      },
      lines: [
        {
          nodePoints,
          startIndex: firstIndex,
          endIndex,
          firstNonWhitespaceIndex,
          countOfPrecedeSpaces:
            line.countOfPrecedeSpaces - (firstIndex - startIndex),
        },
      ],
    }
    return { token, nextIndex }
  }

  /**
   * @override
   * @see TokenizerMatchBlockHook
   */
  public eatContinuationText(
    line: Readonly<PhrasingContentLine>,
    token: Token,
  ): ResultOfEatContinuationText {
    const {
      nodePoints,
      startIndex,
      endIndex,
      firstNonWhitespaceIndex,
      countOfPrecedeSpaces,
    } = line

    if (countOfPrecedeSpaces < 4 && firstNonWhitespaceIndex < endIndex)
      return { status: 'notMatched' }

    /**
     * Blank line is allowed
     * @see https://github.github.com/gfm/#example-81
     * @see https://github.github.com/gfm/#example-82
     */
    const firstIndex = Math.min(endIndex - 1, startIndex + 4)
    token.lines.push({
      nodePoints,
      startIndex: firstIndex,
      endIndex,
      firstNonWhitespaceIndex,
      countOfPrecedeSpaces: countOfPrecedeSpaces - (firstIndex - startIndex),
    })
    return { status: 'opening', nextIndex: endIndex }
  }

  /**
   * @override
   * @see TokenizerParseBlockHook
   */
  public parseBlock(token: Readonly<Token>): ResultOfParse<T, Node> {
    /**
     * Blank lines preceding or following an indented code block
     * are not included in it
     * @see https://github.github.com/gfm/#example-87
     */
    const { lines } = token
    let startLineIndex = 0,
      endLineIndex = lines.length
    for (; startLineIndex < endLineIndex; ++startLineIndex) {
      const line = lines[startLineIndex]
      if (line.firstNonWhitespaceIndex < line.endIndex) break
    }
    for (; startLineIndex < endLineIndex; --endLineIndex) {
      const line = lines[endLineIndex - 1]
      if (line.firstNonWhitespaceIndex < line.endIndex) break
    }

    const contents: NodePoint[] = mergeContentLinesFaithfully(
      lines,
      startLineIndex,
      endLineIndex,
    )
    const node: Node = {
      type: CodeType,
      value: calcStringFromNodePoints(contents),
    }
    return node
  }
}
