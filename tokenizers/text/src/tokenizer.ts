import type { RootMeta as Meta, YastNode } from '@yozora/ast'
import { TextType } from '@yozora/ast'
import type { NodePoint } from '@yozora/character'
import { calcEscapedStringFromNodePoints } from '@yozora/character'
import type {
  InlineFallbackTokenizer,
  ResultOfFindDelimiters,
  Tokenizer,
  TokenizerMatchInlineHook,
  TokenizerParseInlineHook,
} from '@yozora/core-tokenizer'
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
  implements
    Tokenizer<T>,
    InlineFallbackTokenizer<T, Meta, Token, Node>,
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
  public processFullDelimiter(fullDelimiter: Delimiter): Token | null {
    const token: Token = {
      type: this.name,
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
      type: this.name,
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
