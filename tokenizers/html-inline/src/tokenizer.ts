import type { YastNode } from '@yozora/ast'
import { HtmlType } from '@yozora/ast'
import type { NodePoint } from '@yozora/character'
import { AsciiCodePoint, calcStringFromNodePoints } from '@yozora/character'
import type {
  ResultOfProcessSingleDelimiter,
  Tokenizer,
  TokenizerMatchInlineHook,
  TokenizerParseInlineHook,
} from '@yozora/core-tokenizer'
import {
  BaseInlineTokenizer,
  TokenizerPriority,
  eatOptionalWhitespaces,
} from '@yozora/core-tokenizer'
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
      priority: props.priority ?? TokenizerPriority.ATOMIC,
    })
  }

  /**
   * @override
   * @see BaseInlineTokenizer
   */
  protected override _findDelimiter(
    startIndex: number,
    endIndex: number,
    nodePoints: ReadonlyArray<NodePoint>,
  ): Delimiter | null {
    for (let i = startIndex; i < endIndex; ++i) {
      i = eatOptionalWhitespaces(nodePoints, i, endIndex)
      if (i >= endIndex) break

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
  public processSingleDelimiter(
    delimiter: Delimiter,
  ): ResultOfProcessSingleDelimiter<T, Token> {
    const token: Token = {
      ...delimiter,
      nodeType: HtmlType,
    }
    return [token]
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
