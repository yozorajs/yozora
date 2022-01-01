import type { IYastNode } from '@yozora/ast'
import { TextType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import { calcEscapedStringFromNodePoints } from '@yozora/character'
import type {
  IInlineFallbackTokenizer,
  IParseInlinePhaseApi,
  IResultOfProcessSingleDelimiter,
  ITokenizer,
  ITokenizerMatchInlineHook,
  ITokenizerParseInlineHook,
} from '@yozora/core-tokenizer'
import { BaseInlineTokenizer, TokenizerPriority } from '@yozora/core-tokenizer'
import type { IDelimiter, INode, IToken, ITokenizerProps, T } from './types'
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
  extends BaseInlineTokenizer<IDelimiter>
  implements
    ITokenizer,
    IInlineFallbackTokenizer<T, IToken, INode>,
    ITokenizerMatchInlineHook<T, IDelimiter, IToken>,
    ITokenizerParseInlineHook<T, IToken, INode>
{
  /* istanbul ignore next */
  constructor(props: ITokenizerProps = {}) {
    super({
      name: props.name ?? uniqueName,
      priority: props.priority ?? TokenizerPriority.FALLBACK,
    })
  }

  /**
   * @override
   * @see ITokenizerMatchInlineHook
   */
  /* istanbul ignore next */
  protected override _findDelimiter(
    startIndex: number,
    endIndex: number,
  ): IDelimiter | null {
    return {
      type: 'full',
      startIndex,
      endIndex,
    }
  }

  /**
   * @override
   * @see ITokenizerMatchInlineHook
   */
  /* istanbul ignore next */
  public processSingleDelimiter(
    delimiter: IDelimiter,
  ): IResultOfProcessSingleDelimiter<T, IToken> {
    const token: IToken = {
      nodeType: TextType,
      startIndex: delimiter.startIndex,
      endIndex: delimiter.endIndex,
    }
    return [token]
  }

  /**
   * @override
   * @see FallbackInlineTokenizer
   */
  public findAndHandleDelimiter(startIndex: number, endIndex: number): IToken {
    const token: IToken = {
      nodeType: TextType,
      startIndex,
      endIndex,
    }
    return token
  }

  /**
   * @override
   * @see ITokenizerParseInlineHook
   */
  public parseInline(
    token: IToken,
    children: IYastNode[],
    api: Readonly<IParseInlinePhaseApi>,
  ): INode {
    const nodePoints: ReadonlyArray<INodePoint> = api.getNodePoints()
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
    const result: INode = { type: TextType, value }
    return result
  }
}
