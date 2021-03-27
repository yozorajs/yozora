import { ParagraphType } from '@yozora/ast'
import type {
  BlockFallbackTokenizer,
  PhrasingContentLine,
  ResultOfEatContinuationText,
  ResultOfEatLazyContinuationText,
  ResultOfEatOpener,
  ResultOfParse,
  Tokenizer,
  TokenizerMatchBlockHook,
  TokenizerParseBlockHook,
} from '@yozora/core-tokenizer'
import {
  BaseTokenizer,
  buildPhrasingContent,
  calcPositionFromPhrasingContentLines,
  trimBlankLines,
} from '@yozora/core-tokenizer'
import type { Node, T, Token, TokenizerProps } from './types'
import { uniqueName } from './types'

/**
 * Lexical Analyzer for Paragraph.
 *
 * A sequence of non-blank lines that cannot be interpreted as other kinds
 * of blocks forms a paragraph. The contents of the paragraph are the result
 * of parsing the paragraph’s raw content as inlines. The paragraph’s raw
 * content is formed by concatenating the lines and removing initial and
 * final whitespace.
 *
 * @see https://github.com/syntax-tree/mdast#list
 * @see https://github.github.com/gfm/#paragraphs
 */
export class ParagraphTokenizer
  extends BaseTokenizer
  implements
    Tokenizer,
    BlockFallbackTokenizer<T, Token, Node>,
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
  public eatOpener(
    line: Readonly<PhrasingContentLine>,
  ): ResultOfEatOpener<T, Token> {
    const { endIndex, firstNonWhitespaceIndex } = line
    if (firstNonWhitespaceIndex >= endIndex) return null

    const lines: PhrasingContentLine[] = [{ ...line }]
    const position = calcPositionFromPhrasingContentLines(lines)
    const token: Token = {
      _tokenizer: this.name,
      nodeType: ParagraphType,
      position,
      lines: [line],
    }
    return { token, nextIndex: endIndex }
  }

  /**
   * @override
   * @see TokenizerMatchBlockHook
   */
  public eatContinuationText(
    line: Readonly<PhrasingContentLine>,
    token: Token,
  ): ResultOfEatContinuationText {
    const { endIndex, firstNonWhitespaceIndex } = line

    /**
     * Paragraphs can contain multiple lines, but no blank lines
     * @see https://github.github.com/gfm/#example-190
     */
    if (firstNonWhitespaceIndex >= endIndex) {
      return { status: 'notMatched' }
    }

    token.lines.push({ ...line })
    return { status: 'opening', nextIndex: endIndex }
  }

  /**
   * @override
   * @see TokenizerMatchBlockHook
   */
  public eatLazyContinuationText(
    line: Readonly<PhrasingContentLine>,
    token: Token,
  ): ResultOfEatLazyContinuationText {
    const result = this.eatContinuationText(line, token)
    return result as ResultOfEatLazyContinuationText
  }

  /**
   * @override
   * @see TokenizerParseBlockHook
   */
  public parseBlock(token: Readonly<Token>): ResultOfParse<T, Node> {
    const phrasingContent = buildPhrasingContent(token.lines)
    if (phrasingContent == null) return null

    const node: Node = {
      type: ParagraphType,
      children: [phrasingContent],
    }
    return { classification: 'flow', node }
  }

  /**
   * @override
   * @see TokenizerMatchBlockHook
   */
  public extractPhrasingContentLines(
    token: Readonly<Token>,
  ): ReadonlyArray<PhrasingContentLine> {
    return token.lines
  }

  /**
   * @override
   * @see TokenizerMatchBlockHook
   */
  public buildBlockToken(
    _lines: ReadonlyArray<PhrasingContentLine>,
  ): Token | null {
    const lines = trimBlankLines(_lines)
    if (lines == null) return null

    const position = calcPositionFromPhrasingContentLines(lines)
    const token: Token = {
      _tokenizer: this.name,
      nodeType: ParagraphType,
      lines,
      position,
    }
    return token
  }
}
