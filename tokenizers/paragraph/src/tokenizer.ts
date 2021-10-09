import type { YastNode } from '@yozora/ast'
import { ParagraphType } from '@yozora/ast'
import type {
  BlockFallbackTokenizer,
  ParseBlockPhaseApi,
  PhrasingContentLine,
  ResultOfEatContinuationText,
  ResultOfEatLazyContinuationText,
  ResultOfEatOpener,
  ResultOfParse,
  Tokenizer,
  TokenizerMatchBlockHook,
  TokenizerParseBlockHook,
  YastBlockToken,
} from '@yozora/core-tokenizer'
import {
  BaseBlockTokenizer,
  TokenizerPriority,
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
  extends BaseBlockTokenizer
  implements
    Tokenizer,
    BlockFallbackTokenizer<T, Token, Node>,
    TokenizerMatchBlockHook<T, Token>,
    TokenizerParseBlockHook<T, Token, Node>
{
  public readonly isContainingBlock = false

  /* istanbul ignore next */
  constructor(props: TokenizerProps = {}) {
    super({
      name: props.name ?? uniqueName,
      priority: props.priority ?? TokenizerPriority.FALLBACK,
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

    const lines: Array<Readonly<PhrasingContentLine>> = [line]
    const position = calcPositionFromPhrasingContentLines(lines)
    const token: Token = {
      nodeType: ParagraphType,
      position,
      lines,
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

    token.lines.push(line)
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
  public parseBlock(
    token: Readonly<Token>,
    children: YastNode[],
    api: Readonly<ParseBlockPhaseApi>,
  ): ResultOfParse<T, Node> {
    const phrasingContent = api.buildPhrasingContent(token.lines)
    if (phrasingContent == null) return null

    const node: Node = {
      type: ParagraphType,
      children: [phrasingContent],
    }
    return node
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
  ): (Token & YastBlockToken) | null {
    const lines = trimBlankLines(_lines)
    if (lines == null) return null

    const position = calcPositionFromPhrasingContentLines(lines)
    const token: Token & YastBlockToken = {
      _tokenizer: this.name,
      nodeType: ParagraphType,
      lines,
      position,
    }
    return token
  }
}
