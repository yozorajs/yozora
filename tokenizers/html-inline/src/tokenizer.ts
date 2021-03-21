import type { RootMeta as Meta, YastNode } from '@yozora/ast'
import { HtmlType } from '@yozora/ast'
import type { NodePoint } from '@yozora/character'
import { AsciiCodePoint, calcStringFromNodePoints } from '@yozora/character'
import type {
  ResultOfFindDelimiters,
  ResultOfProcessFullDelimiter,
  Tokenizer,
  TokenizerMatchInlineHook,
  TokenizerParseInlineHook,
} from '@yozora/core-tokenizer'
import { eatOptionalWhitespaces } from '@yozora/core-tokenizer'
import type { Delimiter, Node, T, Token, TokenizerProps } from './types'
import { uniqueName } from './types'
import { eatHtmlInlineCDataDelimiter } from './util/cdata'
import { eatHtmlInlineClosingDelimiter } from './util/closing'
import { eatHtmlInlineCommentDelimiter } from './util/comment'
import { eatHtmlInlineDeclarationDelimiter } from './util/declaration'
import { eatHtmlInlineInstructionDelimiter } from './util/instruction'
import { eatHtmlInlineTokenOpenDelimiter } from './util/open'

/**
 * Lexical Analyzer for HtmlInline.
 *
 * Text between '<' and '>' that looks like an HTML tag is parsed as a raw HTML
 * tag and will be rendered in HTML without escaping. Tag and attribute names
 * are not limited to current HTML tags, so custom tags (and even, say, DocBook
 * tags) may be used.
 *
 * @see https://github.github.com/gfm/#raw-html
 */
export class HtmlInlineTokenizer
  implements
    Tokenizer<T>,
    TokenizerMatchInlineHook<T, Delimiter, Token, Meta>,
    TokenizerParseInlineHook<T, Token, Node, Meta> {
  public static readonly uniqueName: T = uniqueName
  public readonly name: T = uniqueName
  public readonly recognizedTypes: T[] = [uniqueName]
  public readonly getContext: Tokenizer['getContext'] = () => null

  public readonly delimiterGroup: string = uniqueName
  public readonly delimiterPriority: number = Number.MAX_SAFE_INTEGER

  /* istanbul ignore next */
  constructor(props: TokenizerProps = {}) {
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
  public findDelimiter(
    startIndex: number,
    endIndex: number,
    nodePoints: ReadonlyArray<NodePoint>,
  ): ResultOfFindDelimiters<Delimiter> {
    for (let i = startIndex; i < endIndex; ++i) {
      i = eatOptionalWhitespaces(nodePoints, i, endIndex)
      const c = nodePoints[i].codePoint
      switch (c) {
        case AsciiCodePoint.BACKSLASH:
          i += 1
          break
        case AsciiCodePoint.OPEN_ANGLE: {
          const delimiter: Delimiter | null = this.tryToEatDelimiter(
            nodePoints,
            i,
            endIndex,
          )
          if (delimiter != null) return delimiter
          break
        }
      }
    }
    return null
  }

  /**
   * @override
   * @see TokenizerMatchInlineHook
   */
  public processFullDelimiter(
    fullDelimiter: Delimiter,
  ): ResultOfProcessFullDelimiter<T, Token> {
    const token: Token = {
      ...fullDelimiter,
      type: this.name,
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
    const { startIndex, endIndex } = token
    const value = calcStringFromNodePoints(nodePoints, startIndex, endIndex)
    const result: Node = { type: HtmlType, value }
    return result
  }

  /**
   * Try to eat a delimiter
   *
   * @param nodePoints
   * @param startIndex
   * @param endIndex
   */
  protected tryToEatDelimiter(
    nodePoints: ReadonlyArray<NodePoint>,
    startIndex: number,
    endIndex: number,
  ): Delimiter | null {
    let delimiter: Delimiter | null = null

    // Try open tag.
    delimiter = eatHtmlInlineTokenOpenDelimiter(
      nodePoints,
      startIndex,
      endIndex,
    )
    if (delimiter != null) return delimiter

    // Try closing tag.
    delimiter = eatHtmlInlineClosingDelimiter(nodePoints, startIndex, endIndex)
    if (delimiter != null) return delimiter

    // Try html comment.
    delimiter = eatHtmlInlineCommentDelimiter(nodePoints, startIndex, endIndex)
    if (delimiter != null) return delimiter

    // Try processing instruction.
    delimiter = eatHtmlInlineInstructionDelimiter(
      nodePoints,
      startIndex,
      endIndex,
    )
    if (delimiter != null) return delimiter

    // Try declaration.
    delimiter = eatHtmlInlineDeclarationDelimiter(
      nodePoints,
      startIndex,
      endIndex,
    )
    if (delimiter != null) return delimiter

    // Try CDATA section.
    delimiter = eatHtmlInlineCDataDelimiter(nodePoints, startIndex, endIndex)
    return delimiter
  }
}
