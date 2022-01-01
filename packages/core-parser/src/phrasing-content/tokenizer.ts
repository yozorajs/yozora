import type {
  IBaseBlockTokenizerProps,
  IPhrasingContent,
  IPhrasingContentLine,
  IResultOfParse,
  IPhrasingContentToken as IToken,
  ITokenizer,
  ITokenizerParseBlockHook,
  IPhrasingContent as Node,
  PhrasingContentType as T,
} from '@yozora/core-tokenizer'
import {
  BaseBlockTokenizer,
  PhrasingContentType,
  calcPositionFromPhrasingContentLines,
  mergeAndStripContentLines,
  trimBlankLines,
} from '@yozora/core-tokenizer'

export const phrasingContentTokenizerUniqueName = '@yozora/tokenizer-phrasing-content'

/**
 * Params for constructing PhrasingContentTokenizer
 */
export type IPhrasingContentTokenizerProps = Partial<IBaseBlockTokenizerProps>

/**
 * Lexical Analyzer for IPhrasingContent
 */
export class PhrasingContentTokenizer
  extends BaseBlockTokenizer
  implements ITokenizer, ITokenizerParseBlockHook<T, IToken, Node>
{
  public readonly isContainingBlock = false

  /* istanbul ignore next */
  constructor(props: IPhrasingContentTokenizerProps = {}) {
    super({
      name: phrasingContentTokenizerUniqueName,
      priority: props.priority ?? 1,
    })
  }

  /**
   * @override
   * @see ITokenizerParseBlockHook
   */
  public parseBlock(token: Readonly<IToken>): IResultOfParse<T, Node> {
    return this.buildPhrasingContent(token.lines)
  }

  /**
   * @override
   * @see ITokenizerMatchBlockHook
   */
  public extractPhrasingContentLines(token: Readonly<IToken>): ReadonlyArray<IPhrasingContentLine> {
    return token.lines
  }

  /**
   * @override
   * @see ITokenizerMatchBlockHook
   */
  public buildBlockToken(_lines: ReadonlyArray<IPhrasingContentLine>): IToken | null {
    const lines = trimBlankLines(_lines)
    if (lines.length <= 0) return null

    const position = calcPositionFromPhrasingContentLines(lines)
    return { _tokenizer: this.name, nodeType: PhrasingContentType, lines, position }
  }

  /**
   * Build IPhrasingContent from PhrasingContentToken.
   * @param lines
   * @returns
   */
  public buildPhrasingContent(lines: ReadonlyArray<IPhrasingContentLine>): IPhrasingContent | null {
    const contents = mergeAndStripContentLines(lines)
    if (contents.length <= 0) return null
    return { type: PhrasingContentType, contents }
  }
}
