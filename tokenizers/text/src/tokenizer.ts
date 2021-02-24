import type { NodePoint } from '@yozora/character'
import type {
  InlineFallbackTokenizer,
  ResultOfFindDelimiters,
  Tokenizer,
  TokenizerMatchInlineHook,
  TokenizerParseInlineHook,
  YastMeta as Meta,
  YastNode,
} from '@yozora/tokenizercore'
import type {
  Text as Node,
  TextToken as Token,
  TextTokenDelimiter as Delimiter,
  TextType as T,
} from './types'
import { calcEscapedStringFromNodePoints } from '@yozora/character'
import { TextType } from './types'

/**
 * Params for constructing TextTokenizer
 */
export interface TextTokenizerProps {
  /**
   * Delimiter group identity.
   */
  readonly delimiterGroup?: string
  /**
   * Delimiter priority.
   */
  readonly delimiterPriority?: number
}

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
  public readonly name: string = TextTokenizer.name
  public readonly recognizedTypes: T[] = [TextType]
  public readonly getContext: Tokenizer['getContext'] = () => null

  public readonly delimiterGroup: string = TextTokenizer.name
  public readonly delimiterPriority: number = Number.MAX_SAFE_INTEGER

  /* istanbul ignore next */
  public constructor(props: TextTokenizerProps = {}) {
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
      type: TextType,
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
      type: TextType,
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
    const result: Node = {
      type: TextType,
      value,
    }
    return result
  }
}
