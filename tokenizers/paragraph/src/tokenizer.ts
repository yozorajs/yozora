import { ParagraphType } from '@yozora/ast'
import type {
  IBlockFallbackTokenizer,
  IMatchBlockHookCreator,
  IParseBlockHookCreator,
  IPhrasingContentLine,
  IYastBlockToken,
} from '@yozora/core-tokenizer'
import {
  BaseBlockTokenizer,
  TokenizerPriority,
  buildPhrasingContent,
  calcPositionFromPhrasingContentLines,
  trimBlankLines,
} from '@yozora/core-tokenizer'
import { match } from './match'
import { parse } from './parse'
import type { IHookContext, INode, IToken, ITokenizerProps, T } from './types'
import { uniqueName } from './types'

/**
 * Lexical Analyzer for Paragraph.
 * @see https://github.com/syntax-tree/mdast#list
 * @see https://github.github.com/gfm/#paragraphs
 */
export class ParagraphTokenizer
  extends BaseBlockTokenizer<T, IToken, INode, IHookContext>
  implements IBlockFallbackTokenizer<T, IToken, INode, IHookContext>
{
  /* istanbul ignore next */
  constructor(props: ITokenizerProps = {}) {
    super({
      name: props.name ?? uniqueName,
      priority: props.priority ?? TokenizerPriority.FALLBACK,
    })
  }

  public override readonly match: IMatchBlockHookCreator<T, IToken, IHookContext> = match

  public override readonly parse: IParseBlockHookCreator<T, IToken, INode, IHookContext> = parse

  public override extractPhrasingContentLines(
    token: Readonly<IToken>,
  ): ReadonlyArray<IPhrasingContentLine> {
    return token.lines
  }

  public override buildBlockToken(
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

  public readonly buildPhrasingContent = buildPhrasingContent
}
