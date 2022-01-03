import type {
  IBaseBlockTokenizerProps,
  IBlockFallbackTokenizer,
  IMatchBlockHookCreator,
  IPhrasingContent as INode,
  IParseBlockHookCreator,
  IPhrasingContentLine,
  IPhrasingContentToken as IToken,
  PhrasingContentType as T,
} from '@yozora/core-tokenizer'
import {
  BaseBlockTokenizer,
  PhrasingContentType,
  buildPhrasingContent,
  calcPositionFromPhrasingContentLines,
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
  extends BaseBlockTokenizer<T, IToken, INode>
  implements IBlockFallbackTokenizer<T, IToken, INode>
{
  /* istanbul ignore next */
  constructor(props: IPhrasingContentTokenizerProps = {}) {
    super({
      name: phrasingContentTokenizerUniqueName,
      priority: props.priority ?? 1,
    })
  }

  public override readonly match: IMatchBlockHookCreator<T, IToken> = () => {
    return {
      isContainingBlock: false,
      eatOpener: () => null,
    }
  }

  public override readonly parse: IParseBlockHookCreator<T, IToken, INode> = () => ({
    parse: token => buildPhrasingContent(token.lines),
  })

  public override extractPhrasingContentLines(
    token: Readonly<IToken>,
  ): ReadonlyArray<IPhrasingContentLine> {
    return token.lines
  }

  public override buildBlockToken(_lines: ReadonlyArray<IPhrasingContentLine>): IToken | null {
    const lines = trimBlankLines(_lines)
    if (lines.length <= 0) return null

    const position = calcPositionFromPhrasingContentLines(lines)
    return { _tokenizer: this.name, nodeType: PhrasingContentType, lines, position }
  }

  public readonly buildPhrasingContent = buildPhrasingContent
}
