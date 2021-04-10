import type { YastNode } from '@yozora/ast'
import { TextType } from '@yozora/ast'
import type { NodePoint } from '@yozora/character'
import { calcEscapedStringFromNodePoints } from '@yozora/character'
import type {
  InlineFallbackTokenizer,
  ResultOfFindDelimiters,
  ResultOfProcessFullDelimiter,
  Tokenizer,
  TokenizerMatchInlineHook,
  TokenizerParseInlineHook,
} from '@yozora/core-tokenizer'
import { BaseTokenizer } from '@yozora/core-tokenizer'
import type { Delimiter, Node, T, Token, TokenizerProps } from './types'
import { uniqueName } from './types'

/**
 * Lexical Analyzer for Text.
 *
 * Any characters not given an interpretation by the other tokenizer will be
 * parsed as plain textual content.
 *
 * @see https://github.com/syntax-tree/mdast#text
 * @see https://github.github.com/gfm/#textual-content
 */
export class TextTokenizer
  extends BaseTokenizer
  implements
    Tokenizer,
    InlineFallbackTokenizer<T, Token, Node>,
    TokenizerMatchInlineHook<T, Delimiter, Token>,
    TokenizerParseInlineHook<T, Token, Node> {
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
  /* istanbul ignore next */
  public findDelimiter(
    startIndex: number,
    endIndex: number,
  ): ResultOfFindDelimiters<Delimiter> {
    const delimiter: Delimiter = {
      type: 'full',
      startIndex,
      endIndex,
    }
    return delimiter
  }

  /**
   * @override
   * @see TokenizerMatchInlineHook
   */
  /* istanbul ignore next */
  public processFullDelimiter(
    fullDelimiter: Delimiter,
  ): ResultOfProcessFullDelimiter<T, Token> {
    const token: Token = {
      nodeType: TextType,
      startIndex: fullDelimiter.startIndex,
      endIndex: fullDelimiter.endIndex,
    }
    return token
  }

  /**
   * @override
   * @see FallbackInlineTokenizer
   */
  public findAndHandleDelimiter(startIndex: number, endIndex: number): Token {
    const token: Token = {
      nodeType: TextType,
      startIndex,
      endIndex,
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
    let value: string = calcEscapedStringFromNodePoints(
      nodePoints,
      startIndex,
      endIndex,
    )

    /**
     * Spaces at the end of the line and beginning of the next line are removed
     * @see https://github.github.com/gfm/#example-670
     */
    value = value.replace(/[^\S\n]*\n[^\S\n]*/g, '\n')
    const result: Node = { type: TextType, value }
    return result
  }
}
