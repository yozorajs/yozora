import type { IYastNode } from '@yozora/ast'
import { ParagraphType } from '@yozora/ast'
import type {
  IBlockFallbackTokenizer,
  IMatchBlockHook,
  IParseBlockHook,
  IParseBlockPhaseApi,
  IPhrasingContentLine,
  IResultOfEatContinuationText,
  IResultOfEatLazyContinuationText,
  IResultOfEatOpener,
  IResultOfParse,
  ITokenizer,
  IYastBlockToken,
} from '@yozora/core-tokenizer'
import {
  BaseBlockTokenizer,
  TokenizerPriority,
  calcPositionFromPhrasingContentLines,
  trimBlankLines,
} from '@yozora/core-tokenizer'
import type { INode, IToken, ITokenizerProps, T } from './types'
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
    ITokenizer,
    IBlockFallbackTokenizer<T, IToken, INode>,
    IMatchBlockHook<T, IToken>,
    IParseBlockHook<T, IToken, INode>
{
  public readonly isContainingBlock = false

  /* istanbul ignore next */
  constructor(props: ITokenizerProps = {}) {
    super({
      name: props.name ?? uniqueName,
      priority: props.priority ?? TokenizerPriority.FALLBACK,
    })
  }

  /**
   * @override
   * @see IMatchBlockHook
   */
  public eatOpener(line: Readonly<IPhrasingContentLine>): IResultOfEatOpener<T, IToken> {
    const { endIndex, firstNonWhitespaceIndex } = line
    if (firstNonWhitespaceIndex >= endIndex) return null

    const lines: Array<Readonly<IPhrasingContentLine>> = [line]
    const position = calcPositionFromPhrasingContentLines(lines)
    const token: IToken = {
      nodeType: ParagraphType,
      position,
      lines,
    }
    return { token, nextIndex: endIndex }
  }

  /**
   * @override
   * @see IMatchBlockHook
   */
  public eatContinuationText(
    line: Readonly<IPhrasingContentLine>,
    token: IToken,
  ): IResultOfEatContinuationText {
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
   * @see IMatchBlockHook
   */
  public eatLazyContinuationText(
    line: Readonly<IPhrasingContentLine>,
    token: IToken,
  ): IResultOfEatLazyContinuationText {
    const result = this.eatContinuationText(line, token)
    return result as IResultOfEatLazyContinuationText
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
    const phrasingContent = api.buildPhrasingContent(token.lines)
    if (phrasingContent == null) return null

    const node: INode = {
      type: ParagraphType,
      children: [phrasingContent],
    }
    return node
  }

  /**
   * @override
   * @see IMatchBlockHook
   */
  public extractPhrasingContentLines(token: Readonly<IToken>): ReadonlyArray<IPhrasingContentLine> {
    return token.lines
  }

  /**
   * @override
   * @see IMatchBlockHook
   */
  public buildBlockToken(
    _lines: ReadonlyArray<IPhrasingContentLine>,
  ): (IToken & IYastBlockToken) | null {
    const lines = trimBlankLines(_lines)
    if (lines.length <= 0) return null

    const position = calcPositionFromPhrasingContentLines(lines)
    const token: IToken & IYastBlockToken = {
      _tokenizer: this.name,
      nodeType: ParagraphType,
      lines,
      position,
    }
    return token
  }
}
