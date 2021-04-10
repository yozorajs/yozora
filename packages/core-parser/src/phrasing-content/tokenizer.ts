import type {
  BaseTokenizerProps,
  PhrasingContent as Node,
  PhrasingContentLine,
  ResultOfParse,
  PhrasingContentType as T,
  PhrasingContentToken as Token,
  Tokenizer,
  TokenizerParseBlockHook,
} from '@yozora/core-tokenizer'
import {
  BaseTokenizer,
  PhrasingContentType,
  buildPhrasingContent,
  calcPositionFromPhrasingContentLines,
  trimBlankLines,
} from '@yozora/core-tokenizer'

export const phrasingContentTokenizerUniqueName =
  '@yozora/tokenizer-phrasing-content'

/**
 * Params for constructing PhrasingContentTokenizer
 */
export type PhrasingContentTokenizerProps = Partial<BaseTokenizerProps>

/**
 * Lexical Analyzer for PhrasingContent
 */
export class PhrasingContentTokenizer
  extends BaseTokenizer
  implements Tokenizer, TokenizerParseBlockHook<T, Token, Node> {
  public readonly isContainerBlock = false

  /* istanbul ignore next */
  constructor(props: PhrasingContentTokenizerProps = {}) {
    super({
      name: phrasingContentTokenizerUniqueName,
      priority: props.priority ?? 1,
    })
  }

  /**
   * @override
   * @see TokenizerParseBlockHook
   */
  public parseBlock(token: Readonly<Token>): ResultOfParse<T, Node> {
    const node: Node | null = buildPhrasingContent(token.lines)
    if (node == null) return null
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
  ): Token | null {
    const lines = trimBlankLines(_lines)
    if (lines == null) return null

    const position = calcPositionFromPhrasingContentLines(lines)
    const token: Token = {
      _tokenizer: this.name,
      nodeType: PhrasingContentType,
      lines,
      position,
    }
    return token
  }
}
